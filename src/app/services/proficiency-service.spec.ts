import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { ProficiencyService } from './proficiency-service';
import { IProficiency } from '../models/interfaces/IProficiency.interface';
import { CustomObservableService } from './custom-observable-service';
import { ISubject } from '../models/interfaces/ISubject.interface';

const mockProficiencies: IProficiency[] = [
  {
    _id: '1',
    name: 'Test Proficiency',
    subjects: {}
  }
];

describe('ProficiencyService', () => {
  let service: ProficiencyService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let customObservableServiceSpy: jasmine.SpyObj<CustomObservableService>;

  beforeEach(() => {
    // Create spy objects for the services, including the new methods and the new service
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'subscribe', 'unsubscribe']);
    const observableSpy = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);

    TestBed.configureTestingModule({
      providers: [
        ProficiencyService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: CustomObservableService, useValue: observableSpy }
      ]
    });

    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    customObservableServiceSpy = TestBed.inject(CustomObservableService) as jasmine.SpyObj<CustomObservableService>;

    // Default spy implementations
    socketServiceSpy.listen.and.returnValue(of(null));
    httpServiceSpy.get.and.returnValue(of([]));

    // Bypass the logic of the custom observable service for this unit test
    customObservableServiceSpy.createManagedTopicObservable.and.callFake((topic, source$) => {
      return source$;
    });

    service = TestBed.inject(ProficiencyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchAllProficiencies', () => {
    it('should fetch proficiencies and update the proficiencies$ subject', (done: DoneFn) => {
      httpServiceSpy.get.and.returnValue(of(mockProficiencies));

      service.fetchAllProficiencies().subscribe(proficiencies => {
        expect(proficiencies).toEqual(mockProficiencies);
        
        service.allProficiencies$.subscribe(proficienciesFromStream => {
          expect(proficienciesFromStream).toEqual(mockProficiencies);
          done();
        });
      });

      expect(httpServiceSpy.get).toHaveBeenCalledWith('proficiencies/fetchAll');
    });
  });

  describe('addOrUpdateProficiency', () => {
    it('should send a POST request and refresh the list', (done: DoneFn) => {
      const newProficiency: Partial<IProficiency> = { name: 'New Proficiency' };
      httpServiceSpy.post.and.returnValue(of(mockProficiencies[0]));
      httpServiceSpy.get.and.returnValue(of(mockProficiencies));

      service.addOrUpdateProficiency(newProficiency).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('proficiencies', newProficiency);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('proficiencies/fetchAll');
        done();
      });
    });
  });

  describe('deleteProficiency', () => {
    it('should send a DELETE request and refresh the list', (done: DoneFn) => {
      const profId = '1';
      httpServiceSpy.delete.and.returnValue(of(undefined)); // delete returns void
      httpServiceSpy.get.and.returnValue(of(mockProficiencies));

      service.deleteProficiency(profId).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`proficiencies/${profId}`);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('proficiencies/fetchAll');
        done();
      });
    });
  });

  describe('updateProficiencyName', () => {
    it('should send a PATCH request and refresh the list', (done: DoneFn) => {
      const profId = '1';
      const newName = 'Updated Name';
      httpServiceSpy.patch.and.returnValue(of(mockProficiencies[0]));
      httpServiceSpy.get.and.returnValue(of(mockProficiencies));

      service.updateProficiencyName(profId, newName).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`proficiencies/${profId}`, { newName });
        expect(httpServiceSpy.get).toHaveBeenCalledWith('proficiencies/fetchAll');
        done();
      });
    });
  });

  describe('addOrUpdateSubject', () => {
    it('should send a POST request for a subject and refresh the list', (done: DoneFn) => {
      const profId = '1';
      const subject: ISubject = { name: 'New Subject', grades: [] };
      const subjectKey = 'new_subject';
      httpServiceSpy.post.and.returnValue(of(mockProficiencies[0]));
      httpServiceSpy.get.and.returnValue(of(mockProficiencies));

      service.addOrUpdateSubject(profId, subject).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith(`proficiencies/${profId}/subjects/${subjectKey}`, subject);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('proficiencies/fetchAll');
        done();
      });
    });
  });

  describe('deleteSubject', () => {
    it('should send a DELETE request for a subject and update the stream', (done: DoneFn) => {
        const profId = '1';
        const subjectKey = 'test_subject';
        const updatedProficiency = { ...mockProficiencies[0], subjects: {} };

        // Prime the BehaviorSubject with the initial data
        service['proficiencies$'].next(mockProficiencies);
        
        httpServiceSpy.delete.and.returnValue(of(updatedProficiency));
        
        service.deleteSubject(profId, subjectKey).subscribe(response => {
            expect(response).toEqual(updatedProficiency);
        });

        // Check if the stream was updated correctly without a full refresh
        service.allProficiencies$.subscribe(profs => {
            expect(profs[0]).toEqual(updatedProficiency);
            done();
        });

        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`proficiencies/${profId}/subjects/${subjectKey}`);
    });
  });
});
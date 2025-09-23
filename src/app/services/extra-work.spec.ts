import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { ExtraWorkService } from './extra-work';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { CustomObservableService } from './custom-observable-service';
import { IExtraWork, EExtraWorkStatus } from '../models/interfaces/IExtraWork.interface';
import { ESocketMessage } from '../models/enums/socket-message.enum';

// Mock data for testing
const mockExtraWork: IExtraWork[] = [
  {
    _id: '1',
    userId: 'user1',
    studentId: 'student1',
    commissionerId: 'commissioner1',
    workType: 'Test & Resource Creation',
    details: 'Creating a new test',
    remuneration: 100,
    dateCompleted: null,
    status: EExtraWorkStatus.InProgress,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    _id: '2',
    userId: 'user2',
    studentId: 'student2',
    commissionerId: 'commissioner2',
    workType: 'Marking',
    details: 'Marking papers',
    remuneration: 150,
    dateCompleted: new Date(),
    status: EExtraWorkStatus.Completed,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

describe('ExtraWorkService', () => {
  let service: ExtraWorkService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let customObservableServiceSpy: jasmine.SpyObj<CustomObservableService>;
  let socketListener$: Subject<unknown>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'subscribe', 'unsubscribe']);
    const observableSpy = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);

    socketListener$ = new Subject<unknown>();

    TestBed.configureTestingModule({
      providers: [
        ExtraWorkService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: CustomObservableService, useValue: observableSpy },
      ],
    });

    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    customObservableServiceSpy = TestBed.inject(CustomObservableService) as jasmine.SpyObj<CustomObservableService>;

    socketServiceSpy.listen.and.returnValue(socketListener$.asObservable());
    httpServiceSpy.get.and.returnValue(of(mockExtraWork));
    httpServiceSpy.post.and.returnValue(of(mockExtraWork[0]));
    httpServiceSpy.patch.and.returnValue(of(mockExtraWork[0]));

    customObservableServiceSpy.createManagedTopicObservable.and.callFake((topic, source$) => {
      return source$;
    });

    service = TestBed.inject(ExtraWorkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllExtraWork', () => {
    it('should fetch all extra work items and update the behavior subject', (done: DoneFn) => {
      service.getAllExtraWork().subscribe((workItems) => {
        expect(workItems).toEqual(mockExtraWork);

        service.allExtraWork$.subscribe((workItemsFromStream) => {
          expect(workItemsFromStream).toEqual(mockExtraWork);
          done();
        });
      });

      expect(httpServiceSpy.get).toHaveBeenCalledWith('extrawork');
    });

    it('should handle API error when fetching extra work', (done: DoneFn) => {
      const errorResponse = { status: 500, statusText: 'Server Error' };
      httpServiceSpy.get.and.returnValue(throwError(() => errorResponse));

      service.getAllExtraWork().subscribe({
        error: (error) => {
          expect(error).toEqual(errorResponse);
          done();
        },
      });
    });
  });

  describe('createExtraWork', () => {
    it('should send a POST request to create a new extra work item', () => {
      const newWorkItem: Partial<IExtraWork> = {
        workType: 'New Task',
        details: 'Details of the new task',
        remuneration: 200,
      };

      service.createExtraWork(newWorkItem).subscribe((item) => {
        expect(item).toEqual(mockExtraWork[0]);
      });

      expect(httpServiceSpy.post).toHaveBeenCalledWith('extrawork', newWorkItem);
    });
  });

  describe('completeExtraWork', () => {
    it('should send a PATCH request to mark an item as complete and trigger a socket subscription', () => {
      const workId = '1';
      const completionDate = new Date();

      service.completeExtraWork(workId, completionDate).subscribe((item) => {
        expect(item).toEqual(mockExtraWork[0]);
      });

      expect(httpServiceSpy.patch).toHaveBeenCalledWith(`extrawork/${workId}/complete`, { dateCompleted: completionDate });
      expect(socketServiceSpy.subscribe).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
    });
  });

  describe('setExtraWorkStatus', () => {
    it('should send a PATCH request to update the status of an item', () => {
      const workId = '1';
      const newStatus = EExtraWorkStatus.Approved;

      service.setExtraWorkStatus(workId, newStatus).subscribe((item) => {
        expect(item).toEqual(mockExtraWork[0]);
      });

      expect(httpServiceSpy.patch).toHaveBeenCalledWith(`extrawork/${workId}/status`, { status: newStatus });
    });
  });

  describe('Socket Integration', () => {
    it('should call getAllExtraWork when an ExtraWorkUpdated event is received', () => {
      spyOn(service, 'getAllExtraWork').and.returnValue(of(mockExtraWork));

      socketListener$.next({ event: ESocketMessage.ExtraWorkUpdated });

      expect(service.getAllExtraWork).toHaveBeenCalled();
    });
  });
});
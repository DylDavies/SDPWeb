import { TestBed } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';
import { BadgeService } from './badge-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { CustomObservableService } from './custom-observable-service';
import IBadge from '../models/interfaces/IBadge.interface';
import { IBadgeRequirement } from '../models/interfaces/IBadgeRequirement.interface';
import { ESocketMessage } from '../models/enums/socket-message.enum';

const mockBadges: IBadge[] = [
  { _id: '1', name: 'Test Badge 1', TLA: 'TB1', image: 'star', summary: 'Summary 1', description: 'Desc 1', permanent: true, bonus: 10 },
  { _id: '2', name: 'Test Badge 2', TLA: 'TB2', image: 'emoji_events', summary: 'Summary 2', description: 'Desc 2', permanent: false, bonus: 5 }
];

const mockBadgeRequirement: IBadgeRequirement = {
  requirements: 'These are the test requirements.'
};

describe('BadgeService', () => {
  let service: BadgeService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let customObservableServiceSpy: jasmine.SpyObj<CustomObservableService>;
  let socketListener$: Subject<unknown>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'subscribe', 'unsubscribe']);
    const observableSpy = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);

    socketListener$ = new Subject<unknown>();

    TestBed.configureTestingModule({
      providers: [
        BadgeService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: CustomObservableService, useValue: observableSpy }
      ]
    });

    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    customObservableServiceSpy = TestBed.inject(CustomObservableService) as jasmine.SpyObj<CustomObservableService>;

    socketServiceSpy.listen.and.returnValue(socketListener$.asObservable());
    httpServiceSpy.get.and.returnValue(of(mockBadges));

    customObservableServiceSpy.createManagedTopicObservable.and.callFake((topic, source$) => {
      return source$;
    });

    service = TestBed.inject(BadgeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getBadges', () => {
    it('should fetch all badges via GET and update the badges$ subject', (done) => {
      service.getBadges().subscribe(badges => {
        expect(badges).toEqual(mockBadges);

        service.allBadges$.subscribe(badgesFromStream => {
          expect(badgesFromStream).toEqual(mockBadges);
          done();
        });
      });

      expect(httpServiceSpy.get).toHaveBeenCalledWith('badges');
    });
  });

  describe('addOrUpdateBadge', () => {
    it('should send a POST request and then refresh the badge list', (done) => {
      const newBadge: IBadge = { _id: '3', name: 'New Badge', TLA: 'NEW', image: 'rocket', summary: 'New Summary', description: 'New Desc', permanent: true, bonus: 0 };
      httpServiceSpy.post.and.returnValue(of(newBadge));
      httpServiceSpy.get.and.returnValue(of([...mockBadges, newBadge]));

      service.addOrUpdateBadge(newBadge).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('badges', newBadge);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('badges');
        done();
      });
    });

    it('should handle errors when adding or updating a badge', (done) => {
      const newBadge: IBadge = { _id: '3', name: 'New Badge', TLA: 'NEW', image: 'rocket', summary: 'New Summary', description: 'New Desc', permanent: true, bonus: 0 };
      httpServiceSpy.post.and.returnValue(throwError(() => new Error('API Error')));

      service.addOrUpdateBadge(newBadge).subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          done();
        }
      });
    });
  });


  describe('deleteBadge', () => {
    it('should send a DELETE request and then refresh the badge list', (done) => {
      const badgeIdToDelete = '1';
      httpServiceSpy.delete.and.returnValue(of(undefined));
      httpServiceSpy.get.and.returnValue(of(mockBadges.filter(b => b._id !== badgeIdToDelete)));

      service.deleteBadge(badgeIdToDelete).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`badges/${badgeIdToDelete}`);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('badges');
        done();
      });
    });
  });

  describe('getBadgeRequirements', () => {
    it('should send a GET request to the correct requirements endpoint', () => {
      const badgeId = '1';
      httpServiceSpy.get.and.returnValue(of(mockBadgeRequirement));
      service.getBadgeRequirements(badgeId).subscribe();
      expect(httpServiceSpy.get).toHaveBeenCalledWith(`badges/${badgeId}/requirements`);
    });
  });

  describe('updateBadgeRequirements', () => {
    it('should send a PATCH request with the correct payload and endpoint', () => {
      const badgeId = '1';
      const newRequirements = 'Updated requirements text.';
      httpServiceSpy.patch.and.returnValue(of({ requirements: newRequirements }));
      service.updateBadgeRequirements(badgeId, newRequirements).subscribe();
      expect(httpServiceSpy.patch).toHaveBeenCalledWith(`badges/${badgeId}/requirements`, { requirements: newRequirements });
    });
  });

  describe('Socket Integration', () => {
    it('should call getBadges when a BadgesUpdated event is received', () => {
      spyOn(service, 'getBadges').and.returnValue(of(mockBadges));

      socketListener$.next({ event: ESocketMessage.BadgesUpdated });

      expect(service.getBadges).toHaveBeenCalled();
    });
  });

  describe('getBadgesByIds', () => {
    beforeEach((done) => {
      httpServiceSpy.get.and.returnValue(of(mockBadges));
      customObservableServiceSpy.createManagedTopicObservable.and.returnValue(of(mockBadges));
      // Populate allBadges$ by calling getBadges
      service.getBadges().subscribe(() => done());
    });

    it('should return an empty array if ids array is empty', (done) => {
      service.getBadgesByIds([]).subscribe(badges => {
        expect(badges).toEqual([]);
        done();
      });
    });

    it('should return an empty array if ids is null', (done) => {
      service.getBadgesByIds(null as any).subscribe(badges => {
        expect(badges).toEqual([]);
        done();
      });
    });

    it('should return an empty array if ids is undefined', (done) => {
      service.getBadgesByIds(undefined as any).subscribe(badges => {
        expect(badges).toEqual([]);
        done();
      });
    });

    it('should filter badges by provided IDs', (done) => {
      const idsToFilter = ['1'];

      service.getBadgesByIds(idsToFilter).subscribe(badges => {
        expect(badges.length).toBe(1);
        expect(badges[0]._id).toBe('1');
        done();
      });
    });

    it('should return multiple badges when multiple IDs match', (done) => {
      const idsToFilter = ['1', '2'];

      service.getBadgesByIds(idsToFilter).subscribe(badges => {
        expect(badges.length).toBe(2);
        expect(badges.map(b => b._id)).toEqual(['1', '2']);
        done();
      });
    });

    it('should return empty array when no IDs match', (done) => {
      const idsToFilter = ['999'];

      service.getBadgesByIds(idsToFilter).subscribe(badges => {
        expect(badges.length).toBe(0);
        done();
      });
    });
  });

  describe('deleteBadge - Error handling', () => {
    it('should handle errors when deleting a badge', (done) => {
      const badgeIdToDelete = '1';
      httpServiceSpy.delete.and.returnValue(throwError(() => new Error('Delete failed')));

      service.deleteBadge(badgeIdToDelete).subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          expect(httpServiceSpy.delete).toHaveBeenCalledWith(`badges/${badgeIdToDelete}`);
          done();
        }
      });
    });
  });

  describe('getBadgeRequirements - Error handling', () => {
    it('should handle errors when fetching badge requirements', (done) => {
      const badgeId = '1';
      httpServiceSpy.get.and.returnValue(throwError(() => new Error('Fetch failed')));

      service.getBadgeRequirements(badgeId).subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          done();
        }
      });
    });
  });

  describe('updateBadgeRequirements - Error handling', () => {
    it('should handle errors when updating badge requirements', (done) => {
      const badgeId = '1';
      const newRequirements = 'Updated requirements text.';
      httpServiceSpy.patch.and.returnValue(throwError(() => new Error('Update failed')));

      service.updateBadgeRequirements(badgeId, newRequirements).subscribe({
        error: (err) => {
          expect(err).toBeDefined();
          done();
        }
      });
    });
  });

  describe('addOrUpdateBadge - with requirements field', () => {
    it('should handle badge data with requirements field', (done) => {
      const newBadge = {
        _id: '3',
        name: 'New Badge',
        TLA: 'NEW',
        image: 'rocket',
        summary: 'New Summary',
        description: 'New Desc',
        permanent: true,
        bonus: 0,
        requirements: 'Special requirements text'
      };
      httpServiceSpy.post.and.returnValue(of(newBadge));
      httpServiceSpy.get.and.returnValue(of([...mockBadges, newBadge]));

      service.addOrUpdateBadge(newBadge).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('badges', newBadge);
        done();
      });
    });
  });
});
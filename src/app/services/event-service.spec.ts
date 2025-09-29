import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { EventService } from './event-service';
import { HttpService } from './http-service';
import { IEvent } from '../models/interfaces/IEvent.interface';

describe('EventService', () => {
  let service: EventService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;

  const mockEvent: IEvent = {
    _id: 'event-123',
    bundle: 'bundle-123',
    student: { _id: 'student-123', displayName: 'John Doe' },
    tutor: { _id: 'tutor-456', displayName: 'Jane Smith' },
    subject: 'math-789',
    startTime: new Date('2025-09-30T10:00:00'),
    duration: 60,
    remarked: false,
    remark: '',
    rating: undefined
  };

  const mockEvents: IEvent[] = [
    mockEvent,
    {
      ...mockEvent,
      _id: 'event-456',
      subject: 'science-456'
    }
  ];

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);

    TestBed.configureTestingModule({
      providers: [
        EventService,
        { provide: HttpService, useValue: httpSpy }
      ]
    });

    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    service = TestBed.inject(EventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createEvent', () => {
    it('should create a new event', (done) => {
      const newEvent: Partial<IEvent> = {
        bundle: 'bundle-123',
        subject: 'math-789',
        startTime: new Date('2025-10-01T14:00:00'),
        duration: 90
      };

      httpServiceSpy.post.and.returnValue(of(mockEvent));

      service.createEvent(newEvent).subscribe((event) => {
        expect(event).toEqual(mockEvent);
        expect(httpServiceSpy.post).toHaveBeenCalledWith('events', newEvent);
        done();
      });
    });

    it('should create event with all fields', (done) => {
      const fullEvent: Partial<IEvent> = {
        bundle: 'bundle-456',
        subject: 'science-789',
        startTime: new Date(),
        duration: 120,
        remarked: false,
        remark: ''
      };

      httpServiceSpy.post.and.returnValue(of(mockEvent));

      service.createEvent(fullEvent).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledWith('events', fullEvent);
        done();
      });
    });
  });

  describe('getEvents', () => {
    it('should retrieve all events', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockEvents));

      service.getEvents().subscribe((events) => {
        expect(events).toEqual(mockEvents);
        expect(events.length).toBe(2);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('events');
        done();
      });
    });

    it('should return empty array when no events exist', (done) => {
      httpServiceSpy.get.and.returnValue(of([]));

      service.getEvents().subscribe((events) => {
        expect(events).toEqual([]);
        expect(events.length).toBe(0);
        done();
      });
    });
  });

  describe('updateEvent', () => {
    it('should update an existing event', (done) => {
      const eventId = 'event-123';
      const updateData: Partial<IEvent> = {
        duration: 90,
        remarked: true
      };
      const updatedEvent = { ...mockEvent, ...updateData };

      httpServiceSpy.patch.and.returnValue(of(updatedEvent));

      service.updateEvent(eventId, updateData).subscribe((event) => {
        expect(event.duration).toBe(90);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`events/${eventId}`, updateData);
        done();
      });
    });

    it('should update event remarked status', (done) => {
      const eventId = 'event-456';
      const updateData: Partial<IEvent> = { remarked: true, remark: 'remark-123' };

      httpServiceSpy.patch.and.returnValue(of(mockEvent));

      service.updateEvent(eventId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`events/${eventId}`, updateData);
        done();
      });
    });

    it('should update event time and duration', (done) => {
      const eventId = 'event-789';
      const updateData: Partial<IEvent> = {
        startTime: new Date('2025-10-15T09:00:00'),
        duration: 120
      };

      httpServiceSpy.patch.and.returnValue(of(mockEvent));

      service.updateEvent(eventId, updateData).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(`events/${eventId}`, updateData);
        done();
      });
    });
  });

  describe('deleteEvent', () => {
    it('should delete an event', (done) => {
      const eventId = 'event-123';

      httpServiceSpy.delete.and.returnValue(of(void 0));

      service.deleteEvent(eventId).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`events/${eventId}`);
        done();
      });
    });

    it('should handle deleting multiple events', (done) => {
      const eventId1 = 'event-1';
      const eventId2 = 'event-2';

      httpServiceSpy.delete.and.returnValue(of(void 0));

      service.deleteEvent(eventId1).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`events/${eventId1}`);

        service.deleteEvent(eventId2).subscribe(() => {
          expect(httpServiceSpy.delete).toHaveBeenCalledWith(`events/${eventId2}`);
          done();
        });
      });
    });
  });

  describe('rateEvent', () => {
    it('should rate an event with a score', (done) => {
      const eventId = 'event-123';
      const rating = 5;
      const ratedEvent = { ...mockEvent, rating };

      httpServiceSpy.patch.and.returnValue(of(ratedEvent));

      service.rateEvent(eventId, rating).subscribe((event) => {
        expect(event.rating).toBe(5);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `events/${eventId}/rate`,
          { rating }
        );
        done();
      });
    });

    it('should rate event with minimum rating', (done) => {
      const eventId = 'event-456';
      const rating = 1;

      httpServiceSpy.patch.and.returnValue(of(mockEvent));

      service.rateEvent(eventId, rating).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `events/${eventId}/rate`,
          { rating: 1 }
        );
        done();
      });
    });

    it('should rate event with maximum rating', (done) => {
      const eventId = 'event-789';
      const rating = 10;

      httpServiceSpy.patch.and.returnValue(of(mockEvent));

      service.rateEvent(eventId, rating).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `events/${eventId}/rate`,
          { rating: 10 }
        );
        done();
      });
    });
  });
});
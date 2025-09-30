import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of, Subject } from 'rxjs';

import { CalendarComponent } from './calendar';
import { EventService } from '../../../services/event-service';
import { SocketService } from '../../../services/socket-service';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { IEvent } from '../../../models/interfaces/IEvent.interface';
import { AddEventModal } from '../../../dashboard/modules/client-dashboard/components/add-event-modal/add-event-modal';
import { RemarkModal } from '../../../dashboard/modules/client-dashboard/components/remark-modal/remark-modal';
import { ESocketMessage } from '../../../models/enums/socket-message.enum'; // <-- FIX: Import ESocketMessage

// --- MOCK DATA ---
const mockAdminUser: IUser = { _id: 'admin1', type: EUserType.Admin } as IUser;
const mockStaffUser: IUser = { _id: 'staff1', type: EUserType.Staff } as IUser;
const mockClientUser: IUser = { _id: 'client1', type: EUserType.Client } as IUser;

// FIX: Use 'subject' instead of 'title' and fill in other required fields
const mockEvents: IEvent[] = [
    { _id: 'event1', subject: 'Past Event 1', startTime: new Date('2024-01-15T10:00:00'), remarked: false, rating: 0, bundle: '', student: {} as any, tutor: {} as any, duration: 60, remark: '' },
    { _id: 'event2', subject: 'Past Event 2', startTime: new Date('2024-01-15T12:00:00'), remarked: true, rating: 5, bundle: '', student: {} as any, tutor: {} as any, duration: 60, remark: '' },
    { _id: 'event3', subject: 'Future Event', startTime: new Date('2099-01-20T14:00:00'), remarked: false, rating: 0, bundle: '', student: {} as any, tutor: {} as any, duration: 60, remark: '' },
];


describe('CalendarComponent', () => {
    let component: CalendarComponent;
    let fixture: ComponentFixture<CalendarComponent>;
    let mockEventService: jasmine.SpyObj<EventService>;
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockAuthService: { currentUser$: BehaviorSubject<IUser | null> };
    let mockDialog: jasmine.SpyObj<MatDialog>;
    let socketListenSubject: Subject<void>;

    beforeEach(async () => {
        mockEventService = jasmine.createSpyObj('EventService', ['getEvents']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['subscribe', 'listen']);
        mockAuthService = {
            currentUser$: new BehaviorSubject<IUser | null>(mockStaffUser),
        };

        // Correct the MatDialog mock
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        // Manually add the internal properties that the real service requires.
        (mockDialog as any).openDialogs = [];
        (mockDialog as any)._afterAllClosed = new Subject<void>();
        (mockDialog as any)._afterOpened = new Subject<void>(); // <-- ADD THIS LINE

        socketListenSubject = new Subject<void>();
        mockSocketService.listen.and.returnValue(socketListenSubject.asObservable());
        mockEventService.getEvents.and.returnValue(of([...mockEvents]));

        await TestBed.configureTestingModule({
            imports: [CalendarComponent],
            providers: [
                provideAnimationsAsync(),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: EventService, useValue: mockEventService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: MatDialog, useValue: mockDialog },
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(CalendarComponent);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('Initialization (ngOnInit)', () => {
        it('should set isStaffOrAdmin to true for Admin user', () => {
            mockAuthService.currentUser$.next(mockAdminUser);
            fixture.detectChanges();
            expect(component.isStaffOrAdmin).toBeTrue();
        });

        it('should set isStaffOrAdmin to true for Staff user', () => {
            mockAuthService.currentUser$.next(mockStaffUser);
            fixture.detectChanges();
            expect(component.isStaffOrAdmin).toBeTrue();
        });

        it('should set isStaffOrAdmin to false for Client user', () => {
            mockAuthService.currentUser$.next(mockClientUser);
            fixture.detectChanges();
            expect(component.isStaffOrAdmin).toBeFalse();
        });

        it('should load events and generate calendar on init', () => {
            spyOn(component, 'loadEvents').and.callThrough();
            spyOn(component, 'generateCalendarDays');
            fixture.detectChanges();
            expect(component.loadEvents).toHaveBeenCalled();
            expect(component.generateCalendarDays).toHaveBeenCalled();
            expect(component.events.length).toBe(3);
        });

        it('should subscribe to socket events and reload on message', () => {
            fixture.detectChanges();
            // FIX: Use the enum member, not a string
            expect(mockSocketService.subscribe).toHaveBeenCalledWith(ESocketMessage.EventsUpdated);
            
            spyOn(component, 'loadEvents');
            socketListenSubject.next();
            
            expect(component.loadEvents).toHaveBeenCalled();
        });
    });

    describe('Calendar Navigation', () => {
        beforeEach(() => {
            component.currentDate = new Date('2024-05-15');
        });

        it('should navigate to the previous month', () => {
            component.previousMonth();
            expect(component.currentDate.getMonth()).toBe(3); // April
        });

        it('should navigate to the next month', () => {
            component.nextMonth();
            expect(component.currentDate.getMonth()).toBe(5); // June
        });
    });

    describe('getEventStatusIcon', () => {
        it('should return null for future events', () => {
            const icon = component.getEventStatusIcon(mockEvents[2]);
            expect(icon).toBeNull();
        });

        it('should return "completed" for a client if past event has a rating', () => {
            component['currentUser'] = mockClientUser;
            const icon = component.getEventStatusIcon(mockEvents[1]);
            expect(icon).toBe('completed');
        });

        it('should return "pending" for a client if past event has no rating', () => {
            component['currentUser'] = mockClientUser;
            const icon = component.getEventStatusIcon(mockEvents[0]);
            expect(icon).toBe('pending');
        });

        it('should return "completed" for staff if past event is remarked', () => {
            component['currentUser'] = mockStaffUser;
            const icon = component.getEventStatusIcon(mockEvents[1]);
            expect(icon).toBe('completed');
        });

        it('should return "pending" for staff if past event is not remarked', () => {
            component['currentUser'] = mockStaffUser;
            const icon = component.getEventStatusIcon(mockEvents[0]);
            expect(icon).toBe('pending');
        });
    });

    describe('Event and Day Interactions', () => {
        it('should return an empty array from getEventsForDay if day is null', () => {
            const events = component.getEventsForDay(null);
            expect(events).toEqual([]);
        });

        it('should filter and sort events for a specific day', () => {
            component.events = mockEvents;
            const day = new Date('2024-01-15');
            const events = component.getEventsForDay(day);
            expect(events.length).toBe(2);
            // Check sorting
            expect(events[0].subject).toBe('Past Event 1');
            expect(events[1].subject).toBe('Past Event 2');
        });

        it('onDayClick should do nothing if day is null', () => {
            component.onDayClick(null);
            expect(mockDialog.open).not.toHaveBeenCalled();
        });

        it('onDayClick should do nothing if user is not staff or admin', () => {
            component.isStaffOrAdmin = false;
            component.onDayClick(new Date());
            expect(mockDialog.open).not.toHaveBeenCalled();
        });
    });

    describe('Utility Functions', () => {
        it('getEventTime should format the time correctly', () => {
            const event = { startTime: new Date('2024-01-15T09:05:00') } as IEvent;
            expect(component.getEventTime(event)).toBe('09:05');
        });
    });
});
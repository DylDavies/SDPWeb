import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { StudyGroupCalendarComponent } from './study-group-calendar';
import { StudyGroupService } from '../../../../../services/study-group-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IStudyGroup } from '../../../../../models/interfaces/IStudyGroup.interface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

// Mock data for testing
const mockStudyGroups: IStudyGroup[] = [
  {
    id: '1',
    name: 'Calculus Study Group',
    description: 'test',
    creatorId: 'test',
    max_members: 1,
    is_private: false,
    invite_code: 'test',
    status: 'test',
    faculty: 'test',
    course: 'test',
    year_of_study: 'test',
    created_at: 'test',
    updated_at: 'test',
    scheduled_start: new Date().toISOString(),
    scheduled_end: new Date().toISOString(),
    meeting_times: [],
    is_scheduled: false
  },
  {
    id: '2',
    name: 'Physics Study Group',
    description: 'test',
    creatorId: 'test',
    max_members: 1,
    is_private: false,
    invite_code: 'test',
    status: 'test',
    faculty: 'test',
    course: 'test',
    year_of_study: 'test',
    created_at: 'test',
    updated_at: 'test',
    scheduled_start: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    scheduled_end: new Date(new Date().setDate(new Date().getDate() + 1)).toISOString(),
    meeting_times: [],
    is_scheduled: false
  },
];

describe('StudyGroupCalendarComponent', () => {
  let component: StudyGroupCalendarComponent;
  let fixture: ComponentFixture<StudyGroupCalendarComponent>;
  let studyGroupServiceSpy: jasmine.SpyObj<StudyGroupService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    studyGroupServiceSpy = jasmine.createSpyObj('StudyGroupService', ['getUpcomingStudyGroups']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showError']);

    await TestBed.configureTestingModule({
      imports: [StudyGroupCalendarComponent, NoopAnimationsModule],
      providers: [
        { provide: StudyGroupService, useValue: studyGroupServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StudyGroupCalendarComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(of([]));
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should call generateCalendarDays and loadEvents on initialization', () => {
      spyOn(component, 'generateCalendarDays');
      spyOn(component, 'loadEvents');
      studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(of([]));
      component.ngOnInit();
      expect(component.generateCalendarDays).toHaveBeenCalled();
      expect(component.loadEvents).toHaveBeenCalled();
    });
  });

  describe('loadEvents', () => {
    it('should load and process study groups successfully', fakeAsync(() => {
      studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(of(mockStudyGroups));
      component.loadEvents();
      tick();
      expect(component.events.length).toBe(2);
      expect(component.events[0].name).toBe('Calculus Study Group');
    }));

    it('should show an error message if loading study groups fails', fakeAsync(() => {
      studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(throwError(() => new Error('Failed to load')));
      component.loadEvents();
      tick();
      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Could not load upcoming study groups. Please try again later.');
    }));
  });

  describe('Calendar Navigation and Generation', () => {
    beforeEach(() => {
        studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(of([]));
        fixture.detectChanges();
    });

    it('should generate calendar days for the current month', () => {
      component.currentDate = new Date(2025, 8, 15); // September 15, 2025
      component.generateCalendarDays();
      expect(component.daysInMonth.length).toBeGreaterThan(28);
    });

    it('should navigate to the previous month', () => {
      const initialMonth = component.currentDate.getMonth();
      component.previousMonth();
      expect(component.currentDate.getMonth()).not.toBe(initialMonth);
    });

    it('should navigate to the next month', () => {
        const initialMonth = component.currentDate.getMonth();
        component.nextMonth();
        expect(component.currentDate.getMonth()).not.toBe(initialMonth);
      });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
        studyGroupServiceSpy.getUpcomingStudyGroups.and.returnValue(of(mockStudyGroups));
        component.loadEvents();
        fixture.detectChanges();
    });

    it('should return the correct event time', () => {
      const eventTime = component.getEventTime(component.events[0]);
      expect(eventTime).toMatch(/\d{2}:\d{2}/);
    });

    it('should return events for a specific day', () => {
      const today = new Date();
      const eventsToday = component.getEventsForDay(today);
      expect(eventsToday.length).toBe(1);
      expect(eventsToday[0].name).toBe('Calculus Study Group');
    });

    it('should return an empty array for a day with no events', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 5);
        const eventsOnFutureDate = component.getEventsForDay(futureDate);
        expect(eventsOnFutureDate.length).toBe(0);
      });
  
      it('should return an empty array for a null day', () => {
        const events = component.getEventsForDay(null);
        expect(events.length).toBe(0);
      });
  });
});
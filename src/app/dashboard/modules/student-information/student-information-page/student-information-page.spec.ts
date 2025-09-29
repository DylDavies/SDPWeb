import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentInformationPage } from './student-information-page';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { BundleService } from '../../../../services/bundle-service';
import { AuthService } from '../../../../services/auth-service';
import { MatDialog, MatDialogConfig, MatDialogModule } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { IBundle, IPopulatedUser } from '../../../../models/interfaces/IBundle.interface';
import { EPermission } from '../../../../models/enums/permission.enum';
import { IUser } from '../../../../models/interfaces/IUser.interface';
import { EventService } from '../../../../services/event-service';
import { MissionService } from '../../../../services/missions-service';
import { IEvent } from '../../../../models/interfaces/IEvent.interface';
import { IMissions } from '../../../../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../../../../models/enums/mission-status.enum';

// --- MOCK DATA ---
const mockTutor1: IPopulatedUser = { _id: 'tutor1', displayName: 'Jane Doe' };
const mockTutor2: IPopulatedUser = { _id: 'tutor2', displayName: 'Peter Jones' };

const mockBundle: IBundle = {
  _id: 'bundle123',
  student: { _id: 'student1', displayName: 'John Smith' },
  subjects: [
    { _id: 's1', subject: 'Math', grade: '10', tutor: mockTutor1, durationMinutes: 5 },
    { _id: 's2', subject: 'Science', grade: '10', tutor: mockTutor2, durationMinutes: 5 },
    { _id: 's3', subject: 'Advanced Math', grade: '11', tutor: mockTutor1, durationMinutes: 10 } // Duplicate tutor
  ],
  createdBy: 'creator1',
  status: 'approved' as any,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockEvents: IEvent[] = [
  { _id: 'e1', bundle: 'bundle123', tutor: mockTutor1, duration: 120, remarked: true } as IEvent,
  { _id: 'e2', bundle: 'bundle123', tutor: mockTutor2, duration: 60, remarked: true } as IEvent
];

// FIX: Updated mock mission to match the provided IMissions interface
const mockMission: IMissions = {
    _id: 'mission1',
    bundleId: 'bundle123',
    documentPath: '/path/to/doc',
    documentName: 'mission_doc.pdf',
    student: 'student1',
    tutor: 'tutor1',
    createdAt: new Date(),
    remuneration: 500,
    commissionedBy: 'creator1',
    hoursCompleted: 0,
    dateCompleted: new Date(),
    status: EMissionStatus.Active,
    updatedAt: new Date(),
};


describe('StudentInformationPage', () => {
  let component: StudentInformationPage;
  let fixture: ComponentFixture<StudentInformationPage>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let missionServiceSpy: jasmine.SpyObj<MissionService>;

  // Helper function to create the component with specific route params
  const createComponentWithParams = (params: Record<string, string> | null) => {
    TestBed.overrideProvider(ActivatedRoute, {
      useValue: {
        snapshot: {
          paramMap: convertToParamMap(params || {})
        }
      }
    });

    fixture = TestBed.createComponent(StudentInformationPage);
    component = fixture.componentInstance;
  };

  beforeEach(async () => {
    // Create spies for all services
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundleById']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    eventServiceSpy = jasmine.createSpyObj('EventService', ['getEvents']);
    missionServiceSpy = jasmine.createSpyObj('MissionService', [
      'findMissionByBundleAndTutor',
      'updateMissionHours',
      'getMissionsByBundleId' // Added missing method
    ]);

    await TestBed.configureTestingModule({
      imports: [StudentInformationPage, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: MissionService, useValue: missionServiceSpy },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({}) }
          }
        }
      ]
    }).compileComponents();
  });

  it('should create', () => {
    bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle));
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of([mockMission])); // Mock for child component
    // Provide a mock for the services called within getTutorsFromBundle -> updateAllMissionHours
    eventServiceSpy.getEvents.and.returnValue(of([]));
    createComponentWithParams({ id: 'bundle123' });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should fetch bundle, set data, and extract tutors on successful load', () => {
      bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle));
      missionServiceSpy.getMissionsByBundleId.and.returnValue(of([mockMission]));
      authServiceSpy.hasPermission.and.returnValue(true);
      eventServiceSpy.getEvents.and.returnValue(of([])); // Prevent error from updateAllMissionHours
      createComponentWithParams({ id: 'bundle123' });

      fixture.detectChanges(); // Triggers ngOnInit

      expect(component.isLoading).toBeFalse();
      expect(component.bundleNotFound).toBeFalse();
      expect(component.bundle).toEqual(mockBundle);
      expect(component.bundleId).toBe('bundle123');
      expect(component.canCreateMissions).toBeTrue();
      expect(bundleServiceSpy.getBundleById).toHaveBeenCalledWith('bundle123');

      // Verify tutors were extracted correctly and are unique
      expect(component.tutors.length).toBe(2);
      expect(component.tutors.map(t => t.displayName)).toContain('Jane Doe');
      expect(component.tutors.map(t => t.displayName)).toContain('Peter Jones');
    });

    it('should set bundleNotFound to true if bundle ID is missing', () => {
      createComponentWithParams(null);
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.bundleNotFound).toBeTrue();
      expect(bundleServiceSpy.getBundleById).not.toHaveBeenCalled();
    });

    it('should set bundleNotFound to true if API returns null', () => {
      bundleServiceSpy.getBundleById.and.returnValue(of(null as any));
      createComponentWithParams({ id: 'nonexistent' });
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.bundleNotFound).toBeTrue();
      expect(component.bundle).toBeNull();
    });

    it('should set bundleNotFound to true on API error', () => {
      bundleServiceSpy.getBundleById.and.returnValue(throwError(() => new Error('API Error')));
      createComponentWithParams({ id: 'error-id' });
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.bundleNotFound).toBeTrue();
    });
  });

  describe('User Actions', () => {
    beforeEach(() => {
        bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle));
        missionServiceSpy.getMissionsByBundleId.and.returnValue(of([mockMission]));
        eventServiceSpy.getEvents.and.returnValue(of([]));
        createComponentWithParams({ id: 'bundle123' });
        fixture.detectChanges();
    });

    it('should navigate back to the students dashboard', () => {
        component.goBack();
        expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/students']);
    });

    it('should not open dialog if bundle or student is missing', () => {
        component.bundle = null;
        component.openCreateDialog();
        expect(dialogSpy.open).not.toHaveBeenCalled();
    });

  });

  describe('getDisplayName', () => {
      beforeEach(() => {
        bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle));
        missionServiceSpy.getMissionsByBundleId.and.returnValue(of([mockMission]));
        eventServiceSpy.getEvents.and.returnValue(of([]));
        createComponentWithParams({ id: 'bundle123' });
        fixture.detectChanges();
      });
      it('should return the display name for a populated user', () => {
        const user: IPopulatedUser = { _id: 'user1', displayName: 'Test User' };
        expect(component.getDisplayName(user)).toBe('Test User');
      });

      it('should return "N/A" for a string ID', () => {
        expect(component.getDisplayName('user1')).toBe('N/A');
      });

      it('should return "N/A" for an object without a displayName', () => {
        const user = { _id: 'user1' } as IPopulatedUser;
        expect(component.getDisplayName(user)).toBe('N/A');
      });
  });

  describe('getTutorsFromBundle', () => {
    it('should extract unique tutors from bundle subjects and trigger mission update', () => {
      createComponentWithParams({ id: 'bundle123' });
      component.bundle = mockBundle;
      const spy = spyOn(component, 'updateAllMissionHours');

      component.getTutorsFromBundle();

      expect(component.tutors.length).toBe(2);
      expect(component.tutors.map(t => t._id)).toContain('tutor1');
      expect(component.tutors.map(t => t._id)).toContain('tutor2');
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('updateAllMissionHours', () => {
    beforeEach(() => {
      createComponentWithParams({ id: 'bundle123' });
      component.bundleId = 'bundle123';
    });

    it('should calculate tutor hours from events and call updateMissionsForTutors', () => {
        const spy = spyOn(component, 'updateMissionsForTutors');
        eventServiceSpy.getEvents.and.returnValue(of(mockEvents));

        component.updateAllMissionHours();

        expect(eventServiceSpy.getEvents).toHaveBeenCalled();

        // Verify the map passed to the next function
        const expectedTutorHours = new Map<string, number>([
            ['tutor1', 2], // 120 minutes / 60
            ['tutor2', 1]  // 60 minutes / 60
        ]);
        expect(spy).toHaveBeenCalledWith(expectedTutorHours);
    });

    it('should skip update if bundleId is null', () => {
      component.bundleId = null;
      component.updateAllMissionHours();
      expect(eventServiceSpy.getEvents).not.toHaveBeenCalled();
    });
  });

  describe('updateMissionsForTutors', () => {
    beforeEach(() => {
      createComponentWithParams({ id: 'bundle123' });
      component.bundleId = 'bundle123';
    });

    it('should update mission hours for tutors found', fakeAsync(() => {
        
        missionServiceSpy.findMissionByBundleAndTutor.and.returnValue(of(mockMission));
       
        missionServiceSpy.updateMissionHours.and.returnValue(of(mockMission));

        const tutorHours = new Map<string, number>([['tutor1', 3]]);
        component.updateMissionsForTutors(tutorHours);
        tick();

        expect(missionServiceSpy.findMissionByBundleAndTutor).toHaveBeenCalledWith('bundle123', 'tutor1');
        expect(missionServiceSpy.updateMissionHours).toHaveBeenCalledWith('mission1', 3);
        expect(component.isUpdatingMissions).toBeFalse();
    }));

    it('should handle missing missions gracefully without calling update', fakeAsync(() => {
        // FIX: Return null to simulate a mission not being found
        missionServiceSpy.findMissionByBundleAndTutor.and.returnValue(of(null));

        const tutorHours = new Map<string, number>([['tutor1', 3]]);
        component.updateMissionsForTutors(tutorHours);
        tick();

        expect(missionServiceSpy.findMissionByBundleAndTutor).toHaveBeenCalled();
        expect(missionServiceSpy.updateMissionHours).not.toHaveBeenCalled();
        expect(component.isUpdatingMissions).toBeFalse();
    }));
  });
});
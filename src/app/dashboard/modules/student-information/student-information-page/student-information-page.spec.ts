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

// --- MOCK DATA ---
const mockTutor1: IPopulatedUser = { _id: 'tutor1', displayName: 'Jane Doe' };
const mockTutor2: IPopulatedUser = { _id: 'tutor2', displayName: 'Peter Jones' };

const mockBundle: IBundle = {
  _id: 'bundle123',
  student: { _id: 'student1', displayName: 'John Smith' },
  subjects: [
    { _id: 's1', subject: 'Math', grade: '10', tutor: mockTutor1, durationMinutes : 5 },
    { _id: 's2', subject: 'Science', grade: '10', tutor: mockTutor2, durationMinutes: 5 },
    { _id: 's3', subject: 'Advanced Math', grade: '11', tutor: mockTutor1, durationMinutes: 10 } // Duplicate tutor
  ],
  createdBy: 'creator1',
  status: 'approved' as any,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
};


describe('StudentInformationPage', () => {
  let component: StudentInformationPage;
  let fixture: ComponentFixture<StudentInformationPage>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

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

    await TestBed.configureTestingModule({
      imports: [StudentInformationPage, NoopAnimationsModule, MatDialogModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: MatDialog, useValue: dialogSpy },
        // Provide a default ActivatedRoute that can be overridden
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
    bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle)); // Fix for 'should create'
    createComponentWithParams({ id: 'bundle123' });
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should fetch bundle, set data, and extract tutors on successful load', () => {
      bundleServiceSpy.getBundleById.and.returnValue(of(mockBundle));
      authServiceSpy.hasPermission.and.returnValue(true);
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
});


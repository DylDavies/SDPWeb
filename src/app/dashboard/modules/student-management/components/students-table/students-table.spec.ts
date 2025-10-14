import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { StudentsTable } from './students-table';
import { AuthService } from '../../../../../services/auth-service';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { IBundle, IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

// --- MOCK DATA ---
const mockAdminUser: IUser = {
    _id: 'admin1',
    displayName: 'Admin User',
    type: EUserType.Admin,
    email: 'admin@test.com'
    // ... add other required IUser properties
} as IUser;

const mockStaffUser: IUser = {
    _id: 'staff1',
    displayName: 'Staff User',
    type: EUserType.Staff,
    email: 'staff@test.com'
    // ... add other required IUser properties
} as IUser;

const mockBundles: IBundle[] = [
    {
        _id: 'b1',
        student: { _id: 's1', displayName: 'Student Alpha' } as IPopulatedUser,
        subjects: [{ _id: 'sub1', subject: 'Math', grade: '10', tutor: 'staff1', durationMinutes: 60 }],
        createdBy: { _id: 'c1', displayName: 'Creator X' } as IPopulatedUser,
        status: EBundleStatus.Approved,
        isActive: true,
        createdAt: new Date('2023-01-15'),
        updatedAt: new Date()
    },
    {
        _id: 'b2',
        student: { _id: 's2', displayName: 'Student Zulu' },
        subjects: [{ _id: 'sub2', subject: 'Science', grade: '11', tutor: 'staff2', durationMinutes: 120 }],
        createdBy: { _id: 'c2', displayName: 'Creator Y' } as IPopulatedUser,
        status: EBundleStatus.Approved,
        isActive: true,
        createdAt: new Date('2023-03-20'),
        updatedAt: new Date()
    },
    {
        _id: 'b3',
        student: { _id: 's3', displayName: 'Student Charlie' },
        subjects: [{ _id: 'sub3', subject: 'History', grade: '9', tutor: 'staff1', durationMinutes: 30 }],
        createdBy: 'c3', // Test case for unpopulated creator
        status: EBundleStatus.Approved,
        isActive: true,
        createdAt: new Date('2023-02-10'),
        updatedAt: new Date()
    },
    {
        _id: 'b4',
        student: { _id: 's4', displayName: 'Inactive Student' },
        subjects: [],
        createdBy: 'c4',
        status: EBundleStatus.Approved,
        isActive: false, // Should be filtered out
        createdAt: new Date(),
        updatedAt: new Date()
    }
];

describe('StudentsTable', () => {
    let component: StudentsTable;
    let fixture: ComponentFixture<StudentsTable>;
    let authService: { currentUser$: BehaviorSubject<IUser | null> };
    let bundleServiceSpy: jasmine.SpyObj<BundleService>;
    let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
    let routerSpy: jasmine.SpyObj<Router>;

    // Helper to set up the component with a specific user
    const setupComponentForUser = (user: IUser | null) => {
        authService.currentUser$.next(user);
        fixture.detectChanges(); // This triggers ngOnInit
    };

    beforeEach(async () => {
        // Initialize spies and mocks
        authService = {
            currentUser$: new BehaviorSubject<IUser | null>(null)
        };
        bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles']);
        snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showError']);
        routerSpy = jasmine.createSpyObj('Router', ['navigate']);

        await TestBed.configureTestingModule({
            imports: [StudentsTable, NoopAnimationsModule],
            providers: [
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: authService },
                { provide: BundleService, useValue: bundleServiceSpy },
                { provide: SnackBarService, useValue: snackbarServiceSpy },
                { provide: Router, useValue: routerSpy }
            ]
        }).compileComponents();

        // Default service mock behavior
        bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));

        fixture = TestBed.createComponent(StudentsTable);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    describe('Initialization and Data Loading', () => {
        it('should not load bundles if there is no current user', () => {
            setupComponentForUser(null);
            expect(component.isLoading).toBe(false);
            expect(bundleServiceSpy.getBundles).not.toHaveBeenCalled();
            expect(component.dataSource.data.length).toBe(0);
        });

        it('should show all active students for an Admin user', fakeAsync(() => {
            setupComponentForUser(mockAdminUser);
            tick();

            expect(bundleServiceSpy.getBundles).toHaveBeenCalled();
            expect(component.isLoading).toBe(false);
            // Should filter out the inactive bundle (b4)
            expect(component.dataSource.data.length).toBe(3);
        }));

        it('should show only assigned students for a Staff user', fakeAsync(() => {
            setupComponentForUser(mockStaffUser);
            tick();

            expect(bundleServiceSpy.getBundles).toHaveBeenCalled();
            expect(component.isLoading).toBe(false);
            // Should show b1 and b3 which are assigned to staff1
            expect(component.dataSource.data.length).toBe(2);
            expect(component.dataSource.data.every(b => b.subjects.some(s => s.tutor === 'staff1'))).toBeTrue();
        }));

        it('should handle API error on bundle load', fakeAsync(() => {
            const errorResponse = { error: { message: 'API Error' } };
            bundleServiceSpy.getBundles.and.returnValue(throwError(() => errorResponse));
            setupComponentForUser(mockAdminUser);
            tick();

            expect(component.isLoading).toBe(false);
            expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('API Error');
        }));
    });

    describe('Filtering and Sorting', () => {
        beforeEach(fakeAsync(() => {
            setupComponentForUser(mockAdminUser);
            tick();
        }));

        it('should filter data based on student name', () => {
            const filterEvent = { target: { value: 'Alpha' } } as unknown as Event;
            component.applyFilter(filterEvent);
            expect(component.dataSource.filteredData.length).toBe(1);
            expect(component.dataSource.filteredData[0]._id).toBe('b1');
        });

        it('should filter data based on creator name', () => {
            const filterEvent = { target: { value: 'Creator Y' } } as unknown as Event;
            component.applyFilter(filterEvent);
            expect(component.dataSource.filteredData.length).toBe(1);
            expect(component.dataSource.filteredData[0]._id).toBe('b2');
        });

        it('should correctly sort by student name', () => {
            component.dataSource.sort = component.sort; // Manually assign sort for test
            component.sort.sort({ id: 'student', start: 'asc', disableClear: false });
            const sortedNames = component.dataSource.sortData(component.dataSource.data, component.sort).map(b => (b.student as IPopulatedUser).displayName);
            expect(sortedNames).toEqual(['Student Alpha', 'Student Charlie', 'Student Zulu']);
        });

        it('should correctly sort by total hours (desc)', () => {
            component.dataSource.sort = component.sort;
            component.sort.sort({ id: 'totalHours', start: 'desc', disableClear: false });
            const sortedHours = component.dataSource.sortData(component.dataSource.data, component.sort).map(b => component.getTotalHours(b));
            // b2 (2 hours), b1 (1 hour), b3 (0.5 hours)
            expect(sortedHours).toEqual([2, 1, 0.5]);
        });
    });

    describe('Helper Functions', () => {
        it('getCreatorName should return displayName for populated user', () => {
            const creatorName = component.getCreatorName(mockBundles[0]);
            expect(creatorName).toBe('Creator X');
        });

        it('getCreatorName should return "N/A" for unpopulated creator ID', () => {
            const creatorName = component.getCreatorName(mockBundles[2]);
            expect(creatorName).toBe('N/A');
        });

        it('getTotalHours should correctly sum subject minutes and convert to hours', () => {
            const totalHours = component.getTotalHours(mockBundles[1]);
            expect(totalHours).toBe(2); // 120 minutes
        });

        it('getTotalHours should return 0 if bundle or subjects are missing', () => {
            const bundleWithoutSubjects = { ...mockBundles[0], subjects: undefined } as any;
            expect(component.getTotalHours(bundleWithoutSubjects)).toBe(0);
            expect(component.getTotalHours(null as any)).toBe(0);
        });
    });

    describe('User Interaction', () => {
        it('viewStudentInfo should navigate to the correct student information page', () => {
            component.viewStudentInfo(mockBundles[0]);
            expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/student-info', 'b1']);
        });
    });
});
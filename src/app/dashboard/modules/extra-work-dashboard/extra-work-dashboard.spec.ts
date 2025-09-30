import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ExtraWorkDashboard } from './extra-work-dashboard';
import { ExtraWorkService } from '../../../services/extra-work';
import { SnackBarService } from '../../../services/snackbar-service';
import { AuthService } from '../../../services/auth-service';
import { SocketService } from '../../../services/socket-service';
import { IExtraWork, EExtraWorkStatus } from '../../../models/interfaces/IExtraWork.interface';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EPermission } from '../../../models/enums/permission.enum';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';
import { IPopulatedUser } from '../../../models/interfaces/IBundle.interface';
import { ViewExtraWorkModal } from './components/view-extra-work-modal/view-extra-work-modal';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// --- MOCK DATA ---
const mockCurrentUser: IUser = {
    _id: 'user1',
    displayName: 'Test User',
} as IUser;

const mockCommissionerUser: IUser = {
    _id: 'commissioner1',
    displayName: 'Commissioner User',
} as IUser;

const mockExtraWorkItems: IExtraWork[] = [
    {
        _id: '1',
        userId: mockCurrentUser,
        studentId: { _id: 's1', displayName: 'Student A' } as IPopulatedUser,
        commissionerId: mockCommissionerUser,
        status: EExtraWorkStatus.InProgress,
        workType: 'Marking',
        details: 'Details 1',
        remuneration: 100,
        dateCompleted: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '2',
        userId: { _id: 'user2', displayName: 'Other User' },
        studentId: { _id: 's2', displayName: 'Student B' },
        commissionerId: mockCurrentUser,
        status: EExtraWorkStatus.Completed,
        workType: 'Test Creation',
        details: 'Details 2',
        remuneration: 200,
        dateCompleted: null,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    // NEW: Item with string IDs for helper function tests
    {
        _id: '3',
        userId: 'user3',
        studentId: 'student3',
        commissionerId: 'commissioner3',
        status: EExtraWorkStatus.Approved,
        workType: 'Research',
        details: 'Details 3',
        remuneration: 300,
        dateCompleted: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
    }
];


describe('ExtraWorkDashboard', () => {
    let component: ExtraWorkDashboard;
    let fixture: ComponentFixture<ExtraWorkDashboard>;
    let mockExtraWorkService: { allExtraWork$: BehaviorSubject<IExtraWork[]>, setExtraWorkStatus: jasmine.Spy, completeExtraWork: jasmine.Spy };
    let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
    let mockAuthService: { hasPermission: jasmine.Spy, currentUser$: BehaviorSubject<IUser | null> };
    let mockSocketService: { listen: jasmine.Spy, subscribe: jasmine.Spy, unsubscribe: jasmine.Spy };
    let mockDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        mockExtraWorkService = {
            allExtraWork$: new BehaviorSubject<IExtraWork[]>(mockExtraWorkItems),
            setExtraWorkStatus: jasmine.createSpy('setExtraWorkStatus').and.returnValue(of({})),
            completeExtraWork: jasmine.createSpy('completeExtraWork').and.returnValue(of({}))
        };
        mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
        mockAuthService = {
            hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false),
            currentUser$: new BehaviorSubject<IUser | null>(mockCurrentUser)
        };
        mockSocketService = jasmine.createSpyObj('SocketService', ['subscribe', 'listen', 'unsubscribe']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        mockSocketService.listen.and.returnValue(of({}));

        await TestBed.configureTestingModule({
            imports: [ExtraWorkDashboard, NoopAnimationsModule, HttpClientTestingModule],
            providers: [
                { provide: ExtraWorkService, useValue: mockExtraWorkService },
                { provide: SnackBarService, useValue: mockSnackbarService },
                { provide: AuthService, useValue: mockAuthService },
                { provide: SocketService, useValue: mockSocketService },
                { provide: MatDialog, useValue: mockDialog },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(ExtraWorkDashboard);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('Initialization and Data Loading', () => {

        // NEW: Test for the !this.currentUser branch
        it('should not load data if there is no current user', () => {
            mockAuthService.currentUser$.next(null);
            spyOn(component, 'loadExtraWork').and.callThrough();
            fixture.detectChanges();

            expect(component.loadExtraWork).toHaveBeenCalled();
            expect(mockExtraWorkService.allExtraWork$.observed).toBe(false);
            expect(component.dataSource.data.length).toBe(0);
        });
    });

    describe('User Actions', () => {
        beforeEach(() => fixture.detectChanges());

        it('should approve work successfully', () => {
            spyOn(component, 'loadExtraWork');
            component.approveWork(mockExtraWorkItems[0]);

            expect(mockExtraWorkService.setExtraWorkStatus).toHaveBeenCalledWith(mockExtraWorkItems[0]._id, EExtraWorkStatus.Approved);
            expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Work item approved!');
            expect(component.loadExtraWork).toHaveBeenCalled();
        });

        // NEW: Test for the error path on approveWork
        it('should handle error when approving work fails', () => {
            const errorResponse = new HttpErrorResponse({ error: { message: 'Approval Failed' } });
            mockExtraWorkService.setExtraWorkStatus.and.returnValue(throwError(() => errorResponse));
            spyOn(component, 'loadExtraWork');

            component.approveWork(mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Approval Failed');
            expect(component.loadExtraWork).not.toHaveBeenCalled();
        });

        it('should deny work successfully', () => {
            spyOn(component, 'loadExtraWork');
            component.denyWork(mockExtraWorkItems[0]);

            expect(mockExtraWorkService.setExtraWorkStatus).toHaveBeenCalledWith(mockExtraWorkItems[0]._id, EExtraWorkStatus.Denied);
            expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Work item denied!');
            expect(component.loadExtraWork).toHaveBeenCalled();
        });

        // NEW: Test for the error path on denyWork
        it('should handle error when denying work fails', () => {
            const errorResponse = new HttpErrorResponse({ error: { message: 'Denial Failed' } });
            mockExtraWorkService.setExtraWorkStatus.and.returnValue(throwError(() => errorResponse));
            spyOn(component, 'loadExtraWork');

            component.denyWork(mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Denial Failed');
            expect(component.loadExtraWork).not.toHaveBeenCalled();
        });

        // NEW: Test for the error path on onDateSelected (completing work)
        it('should handle error when completing work fails', () => {
            const errorResponse = new HttpErrorResponse({ error: { message: 'Completion Failed' } });
            mockExtraWorkService.completeExtraWork.and.returnValue(throwError(() => errorResponse));
            spyOn(component, 'loadExtraWork');

            component.onDateSelected(new Date(), mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Completion Failed');
            expect(component.loadExtraWork).not.toHaveBeenCalled();
        });

        
    });

    // NEW: Test group for helper functions
    describe('Helper Functions', () => {
        it('getStudentName should return "N/A" for a string ID', () => {
            const name = component.getStudentName(mockExtraWorkItems[2]); // This item has string IDs
            expect(name).toBe('N/A');
        });

        it('getStudentName should return displayName for a populated user', () => {
            const name = component.getStudentName(mockExtraWorkItems[0]);
            expect(name).toBe('Student A');
        });

        it('getCommissionerName should return "N/A" for a string ID', () => {
            const name = component.getCommissionerName(mockExtraWorkItems[2]);
            expect(name).toBe('N/A');
        });

        it('getCommissionerName should return displayName for a populated user', () => {
            const name = component.getCommissionerName(mockExtraWorkItems[0]);
            expect(name).toBe('Commissioner User');
        });
    });
});
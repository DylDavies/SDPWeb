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

        // Setup default dialog ref with afterClosed returning observable
        const defaultDialogRef = jasmine.createSpyObj('dialogRef', ['afterClosed']);
        defaultDialogRef.afterClosed.and.returnValue(of(null));
        mockDialog.open.and.returnValue(defaultDialogRef);

        // Ensure socket service methods always return proper values
        mockSocketService.subscribe.and.returnValue(undefined); // subscribe returns void
        mockSocketService.unsubscribe.and.returnValue(undefined); // unsubscribe returns void
        mockSocketService.listen.and.returnValue(of({})); // listen returns Observable

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

        it('getCommisionedByName should return "N/A" for a string ID', () => {
            const name = component.getCommisionedByName(mockExtraWorkItems[2]);
            expect(name).toBe('N/A');
        });

        it('getCommisionedByName should return displayName for a populated user', () => {
            const name = component.getCommisionedByName(mockExtraWorkItems[0]);
            expect(name).toBe('Commissioner User');
        });

        it('getCreatedByName should return "N/A" for a string ID', () => {
            const name = component.getCreatedByName(mockExtraWorkItems[2]);
            expect(name).toBe('N/A');
        });

        it('getCreatedByName should return displayName for a populated user', () => {
            const name = component.getCreatedByName(mockExtraWorkItems[0]);
            expect(name).toBe('Test User');
        });
    });

    describe('Data Loading Branches', () => {
        beforeEach(() => fixture.detectChanges());

        it('should load all work items when canViewAll is true', () => {
            mockAuthService.hasPermission.and.returnValue(true);
            component.canViewAll = true;
            component.canApprove = true;
            mockExtraWorkService.allExtraWork$.next(mockExtraWorkItems);

            expect(component.dataSource.data.length).toBe(3);
            expect(component.commissionedDataSource.data.length).toBe(3);
        });

        it('should filter work items when canViewAll is false - dataSource excludes commissioned by user', () => {
            mockAuthService.hasPermission.and.returnValue(false);
            component.canViewAll = false;
            component.canApprove = false;
            mockExtraWorkService.allExtraWork$.next(mockExtraWorkItems);

            // Item 2 has commissionerId = mockCurrentUser, should be filtered out
            const filtered = component.dataSource.data;
            expect(filtered.length).toBe(2);
            expect(filtered.find(v => v._id === '2')).toBeUndefined();
        });

        it('should filter commissioned items when canApprove is true and canViewAll is false', () => {
            mockAuthService.hasPermission.and.callFake((perm: EPermission) => perm === EPermission.EXTRA_WORK_APPROVE);
            component.canViewAll = false;
            component.canApprove = true;
            component.loadExtraWork();

            // Item 1 has userId = mockCurrentUser, should be filtered out from commissioned
            const filtered = component.commissionedDataSource.data;
            expect(filtered.length).toBe(2);
            expect(filtered.find(v => v._id === '1')).toBeUndefined();
        });

        it('should handle error with default message when no error.message provided', () => {
            const errorResponse = new HttpErrorResponse({ error: {} });
            const errorSubject = new BehaviorSubject<IExtraWork[]>([]);
            mockExtraWorkService.allExtraWork$ = errorSubject;

            component.loadExtraWork();

            errorSubject.error(errorResponse);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load extra work.');
            expect(component.isLoading).toBeFalse();
            expect(component.isCommissionedLoading).toBeFalse();
        });

        it('should not load commissioned data if canApprove is false', () => {
            component.canApprove = false;
            component.canViewAll = true;
            mockExtraWorkService.allExtraWork$.next(mockExtraWorkItems);

            expect(component.dataSource.data.length).toBe(3);
            expect(component.commissionedDataSource.data.length).toBe(0);
        });
    });

    describe('ViewChild Setters', () => {
        it('should set myWorkPaginator when provided', () => {
            const mockPaginator = {} as any;
            component['myWorkPaginator'] = mockPaginator;
            expect(component.dataSource.paginator).toBe(mockPaginator);
        });

        it('should set myWorkSort when provided', () => {
            const mockSort = {} as any;
            component['myWorkSort'] = mockSort;
            expect(component.dataSource.sort).toBe(mockSort);
        });

        it('should set commissionedPaginator when provided', () => {
            const mockPaginator = {} as any;
            component['commissionedPaginator'] = mockPaginator;
            expect(component.commissionedDataSource.paginator).toBe(mockPaginator);
        });

        it('should set commissionedSort when provided', () => {
            const mockSort = {} as any;
            component['commissionedSort'] = mockSort;
            expect(component.commissionedDataSource.sort).toBe(mockSort);
        });
    });

    describe('Sorting Data Accessor', () => {
        beforeEach(() => {
            fixture.detectChanges();
            component.ngAfterViewInit();
        });

        it('should sort by createdAt as timestamp', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'createdAt');
            expect(typeof result).toBe('number');
        });

        it('should sort by student displayName', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'student');
            expect(result).toBe('Student A');
        });

        it('should sort by workType', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'workType');
            expect(result).toBe('Marking');
        });

        it('should sort by remuneration', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'remuneration');
            expect(result).toBe(100);
        });

        it('should sort by createdBy displayName', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'createdBy');
            expect(result).toBe('Test User');
        });

        it('should sort by status', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'status');
            expect(result).toBe(EExtraWorkStatus.InProgress);
        });

        it('should return 0 for unknown property', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[0], 'unknownProperty');
            expect(result).toBe(0);
        });

        it('should handle student as string ID in sorting', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[2], 'student');
            expect(result).toBe('');
        });

        it('should handle createdBy as string ID in sorting', () => {
            const result = component.dataSource.sortingDataAccessor(mockExtraWorkItems[2], 'createdBy');
            expect(result).toBe('');
        });

        it('should set commissionedDataSource sortingDataAccessor when canApprove is true', () => {
            component.canApprove = true;
            component.ngAfterViewInit();
            expect(component.commissionedDataSource.sortingDataAccessor).toBe(component.dataSource.sortingDataAccessor);
        });

        it('should not set commissionedDataSource sortingDataAccessor when canApprove is false', () => {
            component.canApprove = false;
            const originalAccessor = component.commissionedDataSource.sortingDataAccessor;
            component.ngAfterViewInit();
            expect(component.commissionedDataSource.sortingDataAccessor).toBe(originalAccessor);
        });
    });

    describe('Filter Functions', () => {
        beforeEach(() => fixture.detectChanges());

        it('should apply filter and reset to first page when paginator exists', () => {
            const mockPaginator = { firstPage: jasmine.createSpy('firstPage') } as any;
            component.dataSource.paginator = mockPaginator;
            const event = { target: { value: '  Test  ' } } as any;

            component.applyFilter(event);

            expect(component.dataSource.filter).toBe('test');
            expect(mockPaginator.firstPage).toHaveBeenCalled();
        });

        it('should apply filter without calling firstPage when paginator is null', () => {
            component.dataSource.paginator = null;
            const event = { target: { value: 'Test' } } as any;

            component.applyFilter(event);

            expect(component.dataSource.filter).toBe('test');
        });

        it('should apply commissioned filter and reset to first page when paginator exists', () => {
            const mockPaginator = { firstPage: jasmine.createSpy('firstPage') } as any;
            component.commissionedDataSource.paginator = mockPaginator;
            const event = { target: { value: '  Test  ' } } as any;

            component.applyCommissionedFilter(event);

            expect(component.commissionedDataSource.filter).toBe('test');
            expect(mockPaginator.firstPage).toHaveBeenCalled();
        });

        it('should apply commissioned filter without calling firstPage when paginator is null', () => {
            component.commissionedDataSource.paginator = null;
            const event = { target: { value: 'Test' } } as any;

            component.applyCommissionedFilter(event);

            expect(component.commissionedDataSource.filter).toBe('test');
        });
    });

    describe('Dialog Interactions', () => {
        let dialogRefSpy: jasmine.SpyObj<any>;

        beforeEach(() => {
            fixture.detectChanges();
            // Setup dialog ref spy after detectChanges
            dialogRefSpy = jasmine.createSpyObj('dialogRef', ['afterClosed']);
            dialogRefSpy.afterClosed.and.returnValue(of(null));
            mockDialog.open.and.returnValue(dialogRefSpy);
        });

        it('should open add work dialog and reload on result', () => {
            dialogRefSpy.afterClosed.and.returnValue(of(true));
            spyOn(component, 'loadExtraWork');

            component.openAddWorkDialog();

            expect(mockDialog.open).toHaveBeenCalled();
            expect(component.loadExtraWork).toHaveBeenCalled();
        });

        it('should open add work dialog and not reload when dialog is cancelled', () => {
            dialogRefSpy.afterClosed.and.returnValue(of(null));
            spyOn(component, 'loadExtraWork');

            component.openAddWorkDialog();

            expect(mockDialog.open).toHaveBeenCalled();
            expect(component.loadExtraWork).not.toHaveBeenCalled();
        });

        it('should open view work dialog and handle Date result', () => {
            const selectedDate = new Date();
            dialogRefSpy.afterClosed.and.returnValue(of(selectedDate));
            spyOn(component, 'onDateSelected');

            component.openViewWorkDialog(mockExtraWorkItems[0]);

            expect(mockDialog.open).toHaveBeenCalledWith(ViewExtraWorkModal, {
                width: 'clamp(500px, 80vw, 650px)',
                autoFocus: false,
                data: { item: mockExtraWorkItems[0], canEdit: component.canEdit }
            });
            expect(component.onDateSelected).toHaveBeenCalledWith(selectedDate, mockExtraWorkItems[0]);
        });

        it('should open view work dialog and not call onDateSelected for non-Date result', () => {
            dialogRefSpy.afterClosed.and.returnValue(of('not a date'));
            spyOn(component, 'onDateSelected');

            component.openViewWorkDialog(mockExtraWorkItems[0]);

            expect(component.onDateSelected).not.toHaveBeenCalled();
        });
    });

    describe('Socket Event Handling', () => {
        it('should subscribe to socket events on init', () => {
            fixture.detectChanges();
            expect(mockSocketService.subscribe).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
        });

        it('should reload data when socket event is received', () => {
            const socketSubject = new Subject();
            mockSocketService.listen.and.returnValue(socketSubject);
            spyOn(component, 'loadExtraWork');

            // Cleanup existing subscriptions before calling ngOnInit again
            component.ngOnDestroy();
            component.ngOnInit();
            socketSubject.next({});

            expect(component.loadExtraWork).toHaveBeenCalled();

            // Cleanup after test
            socketSubject.complete();
        });

        it('should unsubscribe from socket on destroy', () => {
            fixture.detectChanges();
            component.ngOnDestroy();
            expect(mockSocketService.unsubscribe).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
        });
    });

    describe('Error Handling with Default Messages', () => {
        beforeEach(() => fixture.detectChanges());

        it('should use default error message when approving work fails without error.message', () => {
            const errorResponse = new HttpErrorResponse({ error: {} });
            mockExtraWorkService.setExtraWorkStatus.and.returnValue(throwError(() => errorResponse));

            component.approveWork(mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to approve item.');
        });

        it('should use default error message when denying work fails without error.message', () => {
            const errorResponse = new HttpErrorResponse({ error: {} });
            mockExtraWorkService.setExtraWorkStatus.and.returnValue(throwError(() => errorResponse));

            component.denyWork(mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to deny item.');
        });

        it('should use default error message when completing work fails without error.message', () => {
            const errorResponse = new HttpErrorResponse({ error: {} });
            mockExtraWorkService.completeExtraWork.and.returnValue(throwError(() => errorResponse));

            component.onDateSelected(new Date(), mockExtraWorkItems[0]);

            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update item.');
        });
    });
});
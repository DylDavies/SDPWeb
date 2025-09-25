import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { ExtraWorkDashboard } from './extra-work-dashboard';
import { ExtraWorkService } from '../../../services/extra-work';
import { SnackBarService } from '../../../services/snackbar-service';
import { AuthService } from '../../../services/auth-service';
import { SocketService } from '../../../services/socket-service';
import { IExtraWork, EExtraWorkStatus } from '../../../models/interfaces/IExtraWork.interface';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EPermission } from '../../../models/enums/permission.enum';
import { AddExtraWorkModal } from './components/add-extra-work-modal/add-extra-work-modal';
import { ViewExtraWorkModal } from './components/view-extra-work-modal/view-extra-work-modal';
import { HttpErrorResponse } from '@angular/common/http';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';

// --- MOCK DATA ---
const mockUser: IUser = {
    _id: 'user1',
    displayName: 'Test User',
    email: 'test@example.com',
} as IUser;

const mockExtraWorkItems: IExtraWork[] = [
    {
        _id: '1',
        userId: 'user1',
        studentId: { _id: 's1', displayName: 'Student A' },
        commissionerId: { _id: 'c1', displayName: 'Commissioner A' },
        workType: 'Marking',
        details: 'Details 1',
        remuneration: 100,
        dateCompleted: null,
        status: EExtraWorkStatus.InProgress,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        _id: '2',
        userId: 'user2',
        studentId: { _id: 's2', displayName: 'Student B' },
        commissionerId: { _id: 'c2', displayName: 'Commissioner B' },
        workType: 'Test Creation',
        details: 'Details 2',
        remuneration: 200,
        dateCompleted: new Date(),
        status: EExtraWorkStatus.Completed,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

// --- MOCK SERVICES ---
describe('ExtraWorkDashboard', () => {
    let component: ExtraWorkDashboard;
    let fixture: ComponentFixture<ExtraWorkDashboard>;
    let loader: HarnessLoader;
    let mockExtraWorkService: { allExtraWork$: BehaviorSubject<IExtraWork[]>, setExtraWorkStatus: jasmine.Spy, completeExtraWork: jasmine.Spy };
    let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
    let mockAuthService: { hasPermission: jasmine.Spy, currentUser$: BehaviorSubject<IUser | null> };
    let mockSocketService: jasmine.SpyObj<SocketService>;
    let mockDialog: jasmine.SpyObj<MatDialog>;

    beforeEach(async () => {
        // More robust mocks for services with observable properties
        mockExtraWorkService = {
            allExtraWork$: new BehaviorSubject<IExtraWork[]>(mockExtraWorkItems),
            setExtraWorkStatus: jasmine.createSpy('setExtraWorkStatus').and.returnValue(of({})),
            completeExtraWork: jasmine.createSpy('completeExtraWork').and.returnValue(of({}))
        };
        mockAuthService = {
            hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false),
            currentUser$: new BehaviorSubject<IUser | null>(mockUser)
        };
        mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
        mockSocketService = jasmine.createSpyObj('SocketService', ['subscribe', 'listen', 'unsubscribe']);
        mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

        // Default listen to return an empty observable
        mockSocketService.listen.and.returnValue(of({}));

        await TestBed.configureTestingModule({
            imports: [ExtraWorkDashboard, NoopAnimationsModule, HttpClientTestingModule], // Added HttpClientTestingModule
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
        loader = TestbedHarnessEnvironment.loader(fixture);
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('Initialization', () => {
        it('should load extra work on init', () => {
            fixture.detectChanges();
            expect(component.dataSource.data.length).toBe(2);
            expect(component.isLoading).toBeFalse();
        });

        it('should set up socket listeners on init', () => {
            fixture.detectChanges();
            expect(mockSocketService.subscribe).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
            expect(mockSocketService.listen).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
        });

        it('should unsubscribe from observables on destroy', () => {
            fixture.detectChanges();
            spyOn(component['subscriptions'], 'unsubscribe');
            component.ngOnDestroy();
            expect(component['subscriptions'].unsubscribe).toHaveBeenCalled();
            expect(mockSocketService.unsubscribe).toHaveBeenCalledWith(ESocketMessage.ExtraWorkUpdated);
        });
    });

    describe('Data Loading and Filtering', () => {
        it('should handle error when loading extra work', () => {
            const errorResponse = new HttpErrorResponse({ error: { message: 'Failed to load' } });
            mockExtraWorkService.allExtraWork$.error(errorResponse);
            fixture.detectChanges();
            expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load');
            expect(component.isLoading).toBeFalse();
        });

        it('should filter "My Work" table', () => {
            fixture.detectChanges();
            component.applyFilter({ target: { value: 'Marking' } } as any);
            expect(component.dataSource.filteredData.length).toBe(1);
            expect(component.dataSource.filteredData[0].workType).toBe('Marking');
        });
    });

    describe('User Actions', () => {

        it('should approve work and reload data', () => {
            spyOn(component, 'loadExtraWork');
            component.approveWork(mockExtraWorkItems[0]);

            expect(mockExtraWorkService.setExtraWorkStatus).toHaveBeenCalledWith(mockExtraWorkItems[0]._id, EExtraWorkStatus.Approved);
            expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Work item approved!');
            expect(component.loadExtraWork).toHaveBeenCalled();
        });

        it('should deny work and reload data', () => {
            spyOn(component, 'loadExtraWork');
            component.denyWork(mockExtraWorkItems[0]);

            expect(mockExtraWorkService.setExtraWorkStatus).toHaveBeenCalledWith(mockExtraWorkItems[0]._id, EExtraWorkStatus.Denied);
            expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Work item denied!');
            expect(component.loadExtraWork).toHaveBeenCalled();
        });
    });
});
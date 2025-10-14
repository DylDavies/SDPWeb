import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BreakpointObserver, BreakpointState } from '@angular/cdk/layout';
import { BehaviorSubject, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { Sidebar } from './sidebar';
import { AuthService } from '../../../services/auth-service';
import { SidebarService } from '../../../services/sidebar-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { EPermission } from '../../../models/enums/permission.enum';
import { ISidebarItem } from '../../../models/interfaces/ISidebarItem.interface';

// --- MOCK DATA (Corrected) ---
const mockAdminUser: IUser = { _id: 'admin1', type: EUserType.Admin, displayName: 'Admin User' } as IUser;
const mockStaffUser: IUser = { _id: 'staff1', type: EUserType.Staff, permissions: [EPermission.DASHBOARD_VIEW], displayName: 'Staff User' } as IUser;

// FIX: Changed 'name' to 'label', added 'order', and corrected EPermission members
const mockSidebarItems: ISidebarItem[] = [
    { label: 'Dashboard', route: '/dashboard', icon: 'dashboard', requiredPermissions: [EPermission.DASHBOARD_VIEW], order: 1 },
    { label: 'Admin', route: '', icon: 'shield', order: 2, children: [
        { label: 'User Management', route: '/admin/users', icon: 'people', requiredPermissions: [EPermission.USERS_VIEW], order: 1 },
        { label: 'Role Management', route: '/admin/roles', icon: 'key', requiredPermissions: [EPermission.ROLES_VIEW], order: 2 }
    ]},
    { label: 'Public Link', route: '/public', icon: 'link', order: 3 } // No permissions required
];


describe('Sidebar', () => {
    let component: Sidebar;
    let fixture: ComponentFixture<Sidebar>;
    let mockAuthService: {
        currentUser$: BehaviorSubject<IUser | null>,
        hasPermission: jasmine.Spy
    };
    let mockSidebarService: {
        sidebarItems$: BehaviorSubject<ISidebarItem[]>
    };
    let mockBreakpointObserver: {
        observe: jasmine.Spy
    };
    let breakpointSubject: BehaviorSubject<BreakpointState>;

    beforeEach(async () => {
        mockAuthService = {
            currentUser$: new BehaviorSubject<IUser | null>(null),
            hasPermission: jasmine.createSpy('hasPermission').and.returnValue(false)
        };
        mockSidebarService = {
            sidebarItems$: new BehaviorSubject<ISidebarItem[]>([])
        };
        breakpointSubject = new BehaviorSubject<BreakpointState>({ matches: false, breakpoints: {} });
        mockBreakpointObserver = {
            observe: jasmine.createSpy('observe').and.returnValue(breakpointSubject.asObservable())
        };

        await TestBed.configureTestingModule({
            imports: [Sidebar, NoopAnimationsModule],
            providers: [
                provideRouter([]),
                provideHttpClient(),
                provideHttpClientTesting(),
                { provide: AuthService, useValue: mockAuthService },
                { provide: SidebarService, useValue: mockSidebarService },
                { provide: BreakpointObserver, useValue: mockBreakpointObserver }
            ]
        }).compileComponents();

        fixture = TestBed.createComponent(Sidebar);
        component = fixture.componentInstance;
    });

    it('should create', () => {
        fixture.detectChanges();
        expect(component).toBeTruthy();
    });

    describe('Initialization (ngOnInit)', () => {
        it('should subscribe to user, sidebar items, and breakpoints', () => {
            mockAuthService.currentUser$.next(mockStaffUser);
            mockSidebarService.sidebarItems$.next(mockSidebarItems);
            breakpointSubject.next({ matches: true, breakpoints: {} });

            fixture.detectChanges();

            expect(component.user).toEqual(mockStaffUser);
            expect(component.sideBarLinks).toEqual(mockSidebarItems);
            expect(component.isMobile).toBeTrue();
        });
    });

    describe('ngOnDestroy', () => {
        it('should unsubscribe from all subscriptions', () => {
            fixture.detectChanges();

            const userSubSpy = spyOn((component as any).userSubscription, 'unsubscribe');
            const sidebarSubSpy = spyOn((component as any).sideBarSubscription, 'unsubscribe');

            component.ngOnDestroy();

            expect(userSubSpy).toHaveBeenCalled();
            expect(sidebarSubSpy).toHaveBeenCalled();
        });
    });

    describe('canView method', () => {
        it('should return true if no permissions are required', () => {
            expect(component.canView(undefined)).toBeTrue();
            expect(component.canView([])).toBeTrue();
        });

        it('should return true if the user is an Admin, regardless of permissions', () => {
            component.user = mockAdminUser;
            // FIX: Use a valid permission from the enum for the test
            expect(component.canView([EPermission.ROLES_CREATE])).toBeTrue();
        });

        it('should return true if the user has all required permissions', () => {
            component.user = mockStaffUser;
            mockAuthService.hasPermission.and.callFake((perm: EPermission) => {
                return perm === EPermission.DASHBOARD_VIEW;
            });
            expect(component.canView([EPermission.DASHBOARD_VIEW])).toBeTrue();
        });

        it('should return false if the user is missing one of the required permissions', () => {
            component.user = mockStaffUser;
            mockAuthService.hasPermission.and.callFake((perm: EPermission) => {
                return perm === EPermission.DASHBOARD_VIEW;
            });
            // FIX: Use a valid permission from the enum for the test
            expect(component.canView([EPermission.DASHBOARD_VIEW, EPermission.ROLES_CREATE])).toBeFalse();
        });

        it('should return false if there is no user', () => {
            component.user = null;
            expect(component.canView([EPermission.DASHBOARD_VIEW])).toBeFalse();
        });
    });

    describe('shouldShow method', () => {
        beforeEach(() => {
            component.user = mockStaffUser;
        });

        it('should show a link if it has no required permissions', () => {
            const publicLink = mockSidebarItems[2];
            expect(component.shouldShow(publicLink)).toBeTrue();
        });

        it('should show a link if the user has the required permissions', () => {
            const dashboardLink = mockSidebarItems[0];
            spyOn(component, 'canView').and.returnValue(true);
            expect(component.shouldShow(dashboardLink)).toBeTrue();
            expect(component.canView).toHaveBeenCalledWith(dashboardLink.requiredPermissions);
        });

        it('should hide a link if the user does not have the required permissions', () => {
            const dashboardLink = mockSidebarItems[0];
            spyOn(component, 'canView').and.returnValue(false);
            expect(component.shouldShow(dashboardLink)).toBeFalse();
            expect(component.canView).toHaveBeenCalledWith(dashboardLink.requiredPermissions);
        });

        it('should show a category if at least one child is viewable', () => {
            const adminCategory = mockSidebarItems[1];
            
            spyOn(component, 'canView').and.callFake((permissions) => {
                return permissions === adminCategory.children![1].requiredPermissions;
            });
            
            expect(component.shouldShow(adminCategory)).toBeTrue();
        });

        it('should hide a category if no children are viewable', () => {
            const adminCategory = mockSidebarItems[1];
            spyOn(component, 'canView').and.returnValue(false);
            expect(component.shouldShow(adminCategory)).toBeFalse();
        });
    });
});
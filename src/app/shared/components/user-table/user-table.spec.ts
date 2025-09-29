import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';

import { UserTable } from './user-table';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { RoleService, RoleNode } from '../../../services/role-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { EPermission } from '../../../models/enums/permission.enum';
import { ManageUserRolesDialog } from '../../../dashboard/modules/admin-dashboard/components/manage-user-roles/manage-user-roles';

describe('UserTable', () => {
  let component: UserTable;
  let fixture: ComponentFixture<UserTable>;
  let mockAuthService: any;
  let mockUserService: any;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockRoleService: any;
  let mockRouter: jasmine.SpyObj<Router>;
  let usersSubject: BehaviorSubject<IUser[]>;
  let rolesSubject: BehaviorSubject<RoleNode | null>;

  const mockUsers: IUser[] = [
    { _id: '1', displayName: 'User A', email: 'a@a.com', type: EUserType.Staff, roles: [{ _id: 'role1', name: 'Tutor' } as RoleNode], pending: false, disabled: false, permissions: [] ,googleId: '', firstLogin: false, createdAt: new Date(), theme: 'system', leave: [], paymentType: 'Contract', monthlyMinimum: 0, rateAdjustments: []},
    { _id: '2', displayName: 'User B', email: 'b@b.com', type: EUserType.Admin, roles: [{ _id: 'role2', name: 'Admin' } as RoleNode], pending: true, disabled: false, permissions: [] ,googleId: '', firstLogin: false, createdAt: new Date(), theme: 'system', leave: [], paymentType: 'Contract', monthlyMinimum: 0, rateAdjustments: []},
    { _id: '3', displayName: 'User C', email: 'c@c.com', type: EUserType.Client, roles: [], pending: false, disabled: true, permissions: [], googleId: '', firstLogin: false, createdAt: new Date(), theme: 'system', leave: [], paymentType: 'Contract', monthlyMinimum: 0, rateAdjustments: [] },
  ];

  const mockRoleTree: RoleNode = {
    _id: 'root', name: 'Root', color: '#fff', permissions: [], parent: null, children: [
        { _id: 'role1', name: 'Tutor', color: '#fff', permissions: [], parent: 'root', children: [] },
        { _id: 'role2', name: 'Admin', color: '#fff', permissions: [], parent: 'root', children: [] }
    ]
  };

  beforeEach(async () => {
    usersSubject = new BehaviorSubject<IUser[]>(mockUsers);
    rolesSubject = new BehaviorSubject<RoleNode | null>(mockRoleTree);

    mockAuthService = {
      currentUser$: new BehaviorSubject<IUser | null>(mockUsers[1]), // Default to admin user
      hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true),
    };

    mockUserService = {
      allUsers$: usersSubject.asObservable(),
      fetchAllUsers: jasmine.createSpy('fetchAllUsers').and.returnValue(of(mockUsers)),
      approveUser: jasmine.createSpy('approveUser').and.returnValue(of(null)),
      disableUser: jasmine.createSpy('disableUser').and.returnValue(of(null)),
      enableUser: jasmine.createSpy('enableUser').and.returnValue(of(null)),
      updateUserType: jasmine.createSpy('updateUserType').and.returnValue(of(null)),
    };

    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockRoleService = {
        getRoleTree: jasmine.createSpy('getRoleTree').and.returnValue(rolesSubject.asObservable()),
    };
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserTable, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: RoleService, useValue: mockRoleService },
        { provide: Router, useValue: mockRouter },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize and load users', fakeAsync(() => {
    tick();
    expect(mockUserService.fetchAllUsers).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(3);
  }));

  it('should set admin view if user has ADMIN_DASHBOARD_VIEW permission', () => {
    expect(component.isAdminView).toBe(true);
    expect(component.displayedColumns).toContain('actions');
  });

  it('should not set admin view if user lacks permission', () => {
    mockAuthService.hasPermission.and.returnValue(false);
    component.ngOnInit();
    expect(component.isAdminView).toBe(false);
  });

  describe('Filtering', () => {
    it('should filter by text', fakeAsync(() => {
      component.textFilterControl.setValue('User A');
      tick();
      expect(component.dataSource.filteredData.length).toBe(1);
      expect(component.dataSource.filteredData[0].displayName).toBe('User A');
    }));

    it('should filter by role', fakeAsync(() => {
        component.roleFilterControl.setValue(['role1']);
        tick();
        expect(component.dataSource.filteredData.length).toBe(1);
        expect(component.dataSource.filteredData[0].displayName).toBe('User A');
    }));

    it('should combine text and role filters', fakeAsync(() => {
        component.textFilterControl.setValue('User');
        component.roleFilterControl.setValue(['role2']);
        tick();
        expect(component.dataSource.filteredData.length).toBe(1);
        expect(component.dataSource.filteredData[0].displayName).toBe('User B');
    }));
  });

  describe('User Actions', () => {

    it('should approve a user', () => {
        component.approveUser(mockUsers[1], new MouseEvent('click'));
        expect(mockUserService.approveUser).toHaveBeenCalledWith('2');
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('User User B approved.');
    });

    it('should disable a user', () => {
        component.disableUser(mockUsers[0], new MouseEvent('click'));
        expect(mockUserService.disableUser).toHaveBeenCalledWith('1');
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('User User A disabled.');
    });

    it('should enable a user', () => {
        component.enableUser(mockUsers[2], new MouseEvent('click'));
        expect(mockUserService.enableUser).toHaveBeenCalledWith('3');
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('User User C enabled.');
    });

    it('should update user type', () => {
        component.updateUserType(mockUsers[0], EUserType.Admin, new MouseEvent('click'));
        expect(mockUserService.updateUserType).toHaveBeenCalledWith('1', EUserType.Admin);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith("User A's type updated to admin.");
    });

    it('should navigate to user profile', () => {
        component.viewProfile(mockUsers[0]);
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/profile', '1']);
    });
  });

});
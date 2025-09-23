import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { UserTable } from './user-table';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { RoleService, RoleNode } from '../../../services/role-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EPermission } from '../../../models/enums/permission.enum';
import { EUserType } from '../../../models/enums/user-type.enum';
import { Theme } from '../../../services/theme-service';
import { ILeave } from '../../../models/interfaces/ILeave.interface';

// --- MOCK DATA ---
const mockAdminRole: RoleNode = { _id: 'admin_role', name: 'Admin', color: '#F44336' } as RoleNode;
const mockTutorRole: RoleNode = { _id: 'tutor_role', name: 'Tutor', color: '#2196F3' } as RoleNode;

const mockFullUser: IUser = {
  _id: '1',
  displayName: 'Admin User',
  email: 'admin@test.com',
  type: EUserType.Admin,
  roles: [mockAdminRole],
  pending: false,
  disabled: false,
  googleId: 'g1',
  firstLogin: false,
  createdAt: new Date(),
  permissions: [],
  theme: 'light' as Theme,
  leave: [] as ILeave[]
};

const mockUsers: IUser[] = [
  mockFullUser,
  { ...mockFullUser, _id: '2', displayName: 'Tutor One', email: 'tutor1@test.com', type: EUserType.Staff, roles: [mockTutorRole] },
  { ...mockFullUser, _id: '3', displayName: 'Pending User', email: 'pending@test.com', type: EUserType.Staff, roles: [], pending: true },
  { ...mockFullUser, _id: '4', displayName: 'Disabled Tutor', email: 'disabled@test.com', type: EUserType.Staff, roles: [mockTutorRole], disabled: true },
];

const mockRoleTree: RoleNode = {
  _id: 'root', name: 'Root', children: [mockAdminRole, mockTutorRole]
} as RoleNode;


describe('UserTable', () => {
  let component: UserTable;
  let fixture: ComponentFixture<UserTable>;
  let authServiceMock: any;
  let userServiceMock: any;
  let roleServiceSpy: jasmine.SpyObj<RoleService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;

  let allUsersSubject: BehaviorSubject<IUser[]>;
  let currentUserSubject: BehaviorSubject<IUser | null>;

  beforeEach(async () => {
    allUsersSubject = new BehaviorSubject<IUser[]>(mockUsers);
    currentUserSubject = new BehaviorSubject<IUser | null>(mockUsers[0]);

    authServiceMock = {
      currentUser$: currentUserSubject.asObservable(),
      hasPermission: (permission: EPermission) =>
        permission === EPermission.ADMIN_DASHBOARD_VIEW || permission === EPermission.USERS_MANAGE_ROLES
    };

    userServiceMock = {
      allUsers$: allUsersSubject.asObservable(),
      fetchAllUsers: jasmine.createSpy('fetchAllUsers').and.returnValue(of(mockUsers)),
      approveUser: jasmine.createSpy('approveUser').and.returnValue(of(mockUsers[2])),
      disableUser: jasmine.createSpy('disableUser').and.returnValue(of(mockUsers[1])),
      enableUser: jasmine.createSpy('enableUser').and.returnValue(of(mockUsers[3])),
      updateUserType: jasmine.createSpy('updateUserType').and.returnValue(of(mockUsers[1]))
    };

    roleServiceSpy = jasmine.createSpyObj('RoleService', ['getRoleTree']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [UserTable, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: authServiceMock },
        { provide: UserService, useValue: userServiceMock },
        { provide: RoleService, useValue: roleServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: Router, useValue: routerSpy }
      ]
    }).compileComponents();

    roleServiceSpy.getRoleTree.and.returnValue(of(mockRoleTree));
    fixture = TestBed.createComponent(UserTable);
    component = fixture.componentInstance; 
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Initialization and Permissions', () => {
    it('should add actions column if user has admin view permission', () => {
      spyOn(authServiceMock, 'hasPermission').and.returnValue(true);
      fixture.detectChanges();
      expect(component.displayedColumns).toContain('actions');
    });

    it('should not add actions column if user lacks permissions', () => {
      spyOn(authServiceMock, 'hasPermission').and.returnValue(false);
      fixture.detectChanges();
      expect(component.displayedColumns).not.toContain('actions');
    });

    it('should load users and roles on init', fakeAsync(() => {
      fixture.detectChanges(); // ngOnInit
      tick();
      expect(userServiceMock.fetchAllUsers).toHaveBeenCalled();
      expect(roleServiceSpy.getRoleTree).toHaveBeenCalled();
      expect(component.dataSource.data.length).toBe(4);
      expect(component.allRoles.length).toBe(3);
    }));

  });

  describe('Filtering', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should filter by display name (text)', fakeAsync(() => {
      component.textFilterControl.setValue('Tutor One');
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(1);
    }));

    it('should filter by a role name (text)', fakeAsync(() => {
      component.textFilterControl.setValue('admin');
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(1);
    }));

    it('should filter by role selection', fakeAsync(() => {
      component.roleFilterControl.setValue([mockTutorRole._id]);
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(2);
    }));

    it('should return all if roles filter is empty', fakeAsync(() => {
      component.roleFilterControl.setValue([]);
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(4);
    }));

    it('should filter by both text and role', fakeAsync(() => {
      component.textFilterControl.setValue('disabled');
      component.roleFilterControl.setValue([mockTutorRole._id]);
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(1);
    }));

    it('should return no results if text does not match anything', fakeAsync(() => {
      component.textFilterControl.setValue('notfound');
      tick(0);
      expect(component.dataSource.filteredData.length).toBe(0);
    }));

    it('should match pending keyword', fakeAsync(() => {
      component.textFilterControl.setValue('pending');
      tick(0);
      expect(component.dataSource.filteredData.some(u => u.pending)).toBeTrue();
    }));

    it('should match disabled keyword', fakeAsync(() => {
      component.textFilterControl.setValue('disabled');
      tick(0);
      expect(component.dataSource.filteredData.some(u => u.disabled)).toBeTrue();
    }));
  });


  describe('User Actions', () => {
    let event: MouseEvent;

    beforeEach(() => {
      fixture.detectChanges();
      event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
    });

    xit('should open ManageUserRolesDialog', () => {
      component.manageRoles(mockUsers[1], event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(dialogSpy.open).toHaveBeenCalled();
    });

    it('should not open ManageUserRolesDialog if no current user', () => {
      currentUserSubject.next(null);
      fixture.detectChanges();
      component.manageRoles(mockUsers[1], event);
      expect(dialogSpy.open).not.toHaveBeenCalled();
    });

    it('should call approveUser service and show snackbar', () => {
      component.approveUser(mockUsers[2], event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(userServiceMock.approveUser).toHaveBeenCalledWith(mockUsers[2]._id);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should call disableUser service and show snackbar', () => {
      component.disableUser(mockUsers[1], event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(userServiceMock.disableUser).toHaveBeenCalledWith(mockUsers[1]._id);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should call enableUser service and show snackbar', () => {
      component.enableUser(mockUsers[3], event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(userServiceMock.enableUser).toHaveBeenCalledWith(mockUsers[3]._id);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should call updateUserType service and show snackbar', () => {
      const targetType = EUserType.Admin;
      component.updateUserType(mockUsers[1], targetType, event);
      expect(event.stopPropagation).toHaveBeenCalled();
      expect(userServiceMock.updateUserType).toHaveBeenCalledWith(mockUsers[1]._id, targetType);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should navigate to the user profile on viewProfile', () => {
      component.viewProfile(mockUsers[1]);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/dashboard/profile', mockUsers[1]._id]);
    });
  });
});

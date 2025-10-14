import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ManageUserRolesDialog } from './manage-user-roles';
import { RoleService, RoleNode } from '../../../../../services/role-service';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

// A more complete mock user to satisfy the IUser interface
const mockTargetUser: IUser = {
    _id: 'user123',
    roles: [{ _id: 'role1', name: 'Role 1' } as RoleNode],
    displayName: 'Target User',
    email: 'target@test.com',
    type: EUserType.Staff,
    googleId: 'google123',
    firstLogin: false,
    createdAt: new Date(),
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'light',
    leave: [],
    paymentType: 'Contract' as const,
    monthlyMinimum: 0,
    rateAdjustments: []
};
const mockCurrentUser: IUser = {
    _id: 'admin456',
    roles: [],
    type: EUserType.Admin,
    displayName: 'Current User',
    email: 'admin@test.com',
    googleId: 'google456',
    firstLogin: false,
    createdAt: new Date(),
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'light',
    leave: [],
    paymentType: 'Contract' as const,
    monthlyMinimum: 0,
    rateAdjustments: []
};

const mockRoleTree: RoleNode = {
    _id: 'root',
    name: 'Root',
    children: [
        { _id: 'role1', name: 'Role 1' } as RoleNode
    ]
} as RoleNode;

describe('ManageUserRolesDialog', () => {
  let component: ManageUserRolesDialog;
  let fixture: ComponentFixture<ManageUserRolesDialog>;
  let roleServiceSpy: jasmine.SpyObj<RoleService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<ManageUserRolesDialog>>;

  beforeEach(async () => {
    roleServiceSpy = jasmine.createSpyObj('RoleService', ['getRoleTree']);
    userServiceSpy = jasmine.createSpyObj('UserService', ['assignRoleToUser', 'removeRoleFromUser']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    roleServiceSpy.getRoleTree.and.returnValue(of(mockRoleTree));
    userServiceSpy.assignRoleToUser.and.returnValue(of(mockTargetUser));
    userServiceSpy.removeRoleFromUser.and.returnValue(of(mockTargetUser));

    await TestBed.configureTestingModule({
      imports: [ManageUserRolesDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: RoleService, useValue: roleServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            targetUser: mockTargetUser,
            currentUser: mockCurrentUser
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ManageUserRolesDialog);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('should initialize and fetch role tree', fakeAsync(() => {
    fixture.detectChanges();
    tick();
    expect(roleServiceSpy.getRoleTree).toHaveBeenCalled();
    expect(component.dataSource.data.length).toBe(1);
  }));

  it('should assign a role', () => {
    fixture.detectChanges();
    component.toggleRole({ _id: 'role2' } as RoleNode, true);
    expect(userServiceSpy.assignRoleToUser).toHaveBeenCalledWith(mockTargetUser._id, 'role2');
    expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Role assigned successfully.');
  });

  it('should show error if assign role fails', () => {
    userServiceSpy.assignRoleToUser.and.returnValue(throwError(() => new Error('Error')));
    fixture.detectChanges();
    component.toggleRole({ _id: 'role2' } as RoleNode, true);
    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to assign role.');
  });

  it('should remove a role', () => {
    fixture.detectChanges();
    component.toggleRole({ _id: 'role1' } as RoleNode, false);
    expect(userServiceSpy.removeRoleFromUser).toHaveBeenCalledWith(mockTargetUser._id, 'role1');
    expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Role removed successfully.');
  });

  it('should show error if remove role fails', () => {
    userServiceSpy.removeRoleFromUser.and.returnValue(throwError(() => new Error('Error')));
    fixture.detectChanges();
    component.toggleRole({ _id: 'role1' } as RoleNode, false);
    expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to remove role.');
  });

  it('should close the dialog', () => {
    fixture.detectChanges();
    component.onClose();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
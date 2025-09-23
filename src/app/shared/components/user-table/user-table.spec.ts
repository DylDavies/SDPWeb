import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CdkDragStart } from '@angular/cdk/drag-drop';
import { CreateEditRole } from '../../../dashboard/modules/admin-dashboard/components/create-edit-role/create-edit-role';
import { RoleManagement } from '../../../dashboard/modules/admin-dashboard/components/role-management/role-management';
import { AuthService } from '../../../services/auth-service';
import { RoleNode, RoleService } from '../../../services/role-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

// --- MOCK DATA ---
const mockChildRole: RoleNode = { _id: 'child1', name: 'Child Role', parent: 'parent1', permissions: [], color: '#ccc', children: [] };
const mockParentRole: RoleNode = { _id: 'parent1', name: 'Parent Role', parent: 'root', permissions: [], color: '#bbb', children: [mockChildRole] };
const mockRootRole: RoleNode = { _id: 'root', name: 'Root', parent: null, permissions: [], color: '#aaa', children: [mockParentRole] };

describe('RoleManagement', () => {
  let component: RoleManagement;
  let fixture: ComponentFixture<RoleManagement>;
  let roleServiceSpy: jasmine.SpyObj<RoleService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    roleServiceSpy = jasmine.createSpyObj('RoleService', ['getRoleTree', 'deleteRole', 'updateRoleParent']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [RoleManagement, NoopAnimationsModule],
      providers: [
        { provide: RoleService, useValue: roleServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
      ],
    }).compileComponents();

    roleServiceSpy.getRoleTree.and.returnValue(of(mockRootRole));
    authServiceSpy.hasPermission.and.returnValue(true);

    fixture = TestBed.createComponent(RoleManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should fetch and display the role tree on init', fakeAsync(() => {
      tick(); 
      expect(roleServiceSpy.getRoleTree).toHaveBeenCalled();
      expect(component.dataSource.data[0]).toEqual(mockRootRole);
      expect(component.treeControl.dataNodes.length).toBe(1);
    }));

    it('should handle a null role tree from the service', fakeAsync(() => {
        roleServiceSpy.getRoleTree.and.returnValue(of(null as any));
        component.ngOnInit();
        fixture.detectChanges();
        tick();
        expect(component.dataSource.data.length).toBe(0);
      }));
  });

  describe('Dialog Interactions', () => {
    it('should open the create dialog and refresh on success', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      component.openCreateRoleDialog('root');
      expect(dialogSpy.open).toHaveBeenCalledWith(CreateEditRole, jasmine.any(Object));
      const refreshSpy = spyOn((component as any).refreshTree$, 'next');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      component.openCreateRoleDialog('root');
      expect(refreshSpy).toHaveBeenCalled();
    });

     it('should open the edit dialog and refresh on success', () => {
      const refreshSpy = spyOn((component as any).refreshTree$, 'next');
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      component.openEditRoleDialog(mockParentRole);
      expect(dialogSpy.open).toHaveBeenCalledWith(CreateEditRole, jasmine.objectContaining({
        data: { parentId: mockParentRole.parent, role: mockParentRole }
      }));
      expect(refreshSpy).toHaveBeenCalled();
    });

    it('should open the delete dialog and call delete service on confirm', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      roleServiceSpy.deleteRole.and.returnValue(of({ message: 'Role deleted' }));
      component.deleteRole(mockChildRole);
      expect(dialogSpy.open).toHaveBeenCalledWith(ConfirmationDialog, jasmine.any(Object));
      expect(roleServiceSpy.deleteRole).toHaveBeenCalledWith(mockChildRole._id);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    });

    it('should not call delete service if confirmation is cancelled', () => {
      dialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);
      component.deleteRole(mockChildRole);
      expect(roleServiceSpy.deleteRole).not.toHaveBeenCalled();
    });

    it('should show an error if delete service fails', () => {
        const errorResponse = { error: { error: 'Deletion failed' } };
        dialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
        roleServiceSpy.deleteRole.and.returnValue(throwError(() => errorResponse));
        component.deleteRole(mockChildRole);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Deletion failed');
    });
  });

  describe('Drag and Drop', () => {
    beforeEach(fakeAsync(() => {
        component.ngOnInit();
        tick();
    }));

    it('should not update if dragged node is dropped on itself', () => {
        component.draggedNode = mockParentRole;
        component.dragHoveredNode = mockParentRole;
        component.onDrop();
        expect(roleServiceSpy.updateRoleParent).not.toHaveBeenCalled();
    });

    it('should show an error if a parent is dropped into a child', () => {
        component.draggedNode = mockRootRole; 
        component.dragHoveredNode = mockChildRole; 
        component.onDrop();
        expect(roleServiceSpy.updateRoleParent).not.toHaveBeenCalled();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot move a role into one of its own children.');
    });

    it('should call updateRoleParent on a valid drop and show success', () => {
        const anotherParent: RoleNode = { _id: 'parent2', name: 'Another Parent', parent: 'root', permissions: [], color: '#ddd', children: [] };
        const localMockRoot = JSON.parse(JSON.stringify(mockRootRole));
        localMockRoot.children.push(anotherParent);
        roleServiceSpy.getRoleTree.and.returnValue(of(localMockRoot));
        component.ngOnInit(); 
        const updatedChildRole = { ...mockChildRole, parent: anotherParent._id };
        roleServiceSpy.updateRoleParent.and.returnValue(of(updatedChildRole));
        
        component.draggedNode = mockChildRole;
        component.dragHoveredNode = anotherParent;
        
        component.onDrop();
        
        expect(roleServiceSpy.updateRoleParent).toHaveBeenCalledWith(mockChildRole._id, anotherParent._id);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Role hierarchy updated successfully.');
    });

    it('should handle updateRoleParent API error', () => {
        const errorResponse = { error: { message: 'Update failed' } };
        roleServiceSpy.updateRoleParent.and.returnValue(throwError(() => errorResponse));
        component.draggedNode = mockChildRole;
        const anotherParent: RoleNode = { _id: 'parent2', name: 'Another Parent', parent: 'root', permissions: [], color: '#ddd', children: [] };
        component.dragHoveredNode = anotherParent;
        
        component.onDrop();
        
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update failed');
    });
  });
});
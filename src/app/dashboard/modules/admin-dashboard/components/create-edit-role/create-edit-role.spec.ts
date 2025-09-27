import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { CreateEditRole } from './create-edit-role';
import { RoleService, RoleNode } from '../../../../../services/role-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { EPermission } from '../../../../../models/enums/permission.enum';

// --- MOCK DATA ---
const mockRole: RoleNode = {
  _id: 'role123',
  name: 'Test Role',
  permissions: [EPermission.DASHBOARD_VIEW],
  parent: 'parent123',
  color: '#673ab7',
  children: []
};
const mockRoleTree: RoleNode = {
  _id: 'root', name: 'Root', parent: null, color: '#000', permissions: [], children: [
    { _id: 'parent123', name: 'Parent', parent: 'root', color: '#111', permissions: [], children: [mockRole] }
  ]
};

// --- MOCK SERVICES ---
let roleServiceSpy: jasmine.SpyObj<RoleService>;
let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateEditRole>>;

describe('CreateEditRole', () => {
  let component: CreateEditRole;
  let fixture: ComponentFixture<CreateEditRole>;

  // Configure the test bed once with all necessary mock providers.
  beforeEach(async () => {
    roleServiceSpy = jasmine.createSpyObj('RoleService', ['getRoleTree', 'createRole', 'updateRole']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Set a default mock. Tests that need a different value will override this.
    roleServiceSpy.getRoleTree.and.returnValue(of(mockRoleTree));

    await TestBed.configureTestingModule({
      imports: [CreateEditRole, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: RoleService, useValue: roleServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();
  });

  // Helper to create the component after TestBed is fully configured
  const createComponent = (data: any) => {
    TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: data });
    fixture = TestBed.createComponent(CreateEditRole);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('in Create Mode', () => {
    it('should initialize an empty form for a new root role', () => {
      createComponent({ parentId: null });
      expect(component.roleForm.value.name).toBe('');
      expect(component.roleForm.value.color).toBe(component.presetColors[0]);
    });

    it('should not try to find a parent name if parentId is null', () => {
      createComponent({ parentId: null });
      let parentName: string | null = 'initial';
      component.parentRoleName$.subscribe(name => parentName = name);

      // We call getRoleTree in the beforeEach now, so we reset and check it's not called again.
      roleServiceSpy.getRoleTree.calls.reset();
      component.ngOnInit(); // re-run ngOnInit to check logic
      expect(roleServiceSpy.getRoleTree).not.toHaveBeenCalled();
      expect(parentName).toBeNull();
    });

    it('should fetch the parent role name for a new child role', fakeAsync(() => {
      createComponent({ parentId: 'parent123' });
      let parentName: string | null = null;
      component.parentRoleName$.subscribe(name => {
        parentName = name;
      });
      tick();

      expect(roleServiceSpy.getRoleTree).toHaveBeenCalled();
      expect(parentName!).toBe('Parent');
    }));

    it('should handle parent role not being found in tree', fakeAsync(() => {
      createComponent({ parentId: 'nonexistent' });
      let parentName: string | null = 'initial';
      component.parentRoleName$.subscribe(name => parentName = name);
      tick();
      expect(parentName).toBeNull();
    }));

    it('should handle getRoleTree returning a null tree', fakeAsync(() => {
      // Override the default mock for this specific test case
      roleServiceSpy.getRoleTree.and.returnValue(of(null as any));
      createComponent({ parentId: 'parent123' });
  
      let parentName: string | null = 'initial';
      component.parentRoleName$.subscribe(name => parentName = name);
      tick();
  
      expect(parentName).toBeNull();
    }));

    it('should call createRole on save and show success', fakeAsync(() => {
      roleServiceSpy.createRole.and.returnValue(of({} as any));
      createComponent({ parentId: 'parent123' });
      
      // Provide a non-empty array for permissions to make the form valid
      component.roleForm.setValue({ name: 'New Child', color: '#FFF', permissions: [EPermission.DASHBOARD_VIEW] });
      component.onSave();
      tick();

      expect(component.isSaving).toBe(true);
      expect(roleServiceSpy.createRole).toHaveBeenCalledWith(
        jasmine.objectContaining({ name: 'New Child', parent: 'parent123' })
      );
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Role "New Child" created successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should handle API error during creation', fakeAsync(() => {
        roleServiceSpy.createRole.and.returnValue(throwError(() => new Error('API Error')));
        createComponent({ parentId: 'parent123' });
  
        // Provide a non-empty array for permissions to make the form valid
        component.roleForm.setValue({ name: 'Test', color: '#FFF', permissions: [EPermission.DASHBOARD_VIEW] });
        component.onSave();
        tick();
  
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create role.');
        expect(component.isSaving).toBeFalse();
        expect(dialogRefSpy.close).not.toHaveBeenCalled();
      }));
  });

  describe('in Edit Mode', () => {
    it('should initialize the form with existing role data', () => {
      createComponent({ role: mockRole });
      expect(component.roleForm.value.name).toBe(mockRole.name);
      expect(component.roleForm.value.permissions).toEqual(mockRole.permissions);
    });

    it('should handle 9-digit hex colors by trimming them', () => {
        createComponent({ role: { ...mockRole, color: '#ff0000aa' } });
        expect(component.roleForm.value.color).toBe('#ff0000');
    });

    it('should call updateRole on save and show success', fakeAsync(() => {
      roleServiceSpy.updateRole.and.returnValue(of({} as any));
      createComponent({ role: mockRole });
      
      // Provide a non-empty array for permissions to make the form valid
      component.roleForm.setValue({ name: 'Updated Role', color: '#000', permissions: [EPermission.DASHBOARD_VIEW] });
      component.onSave();
      tick();

      expect(roleServiceSpy.updateRole).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Role "Updated Role" updated successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should handle API error during update', fakeAsync(() => {
      roleServiceSpy.updateRole.and.returnValue(throwError(() => new Error()));
      createComponent({ role: mockRole });

      // Provide a non-empty array for permissions to make the form valid
      component.roleForm.setValue({ name: 'Updated Role', color: '#000', permissions: [EPermission.DASHBOARD_VIEW] });
      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update role.');
      expect(component.isSaving).toBeFalse();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));
  });

  describe('General Component Logic', () => {
    beforeEach(() => {
        createComponent({ parentId: null });
    });

    it('should not save if the form is invalid', () => {
      component.roleForm.get('name')?.setValue(''); // Make form invalid
      component.onSave();
      expect(roleServiceSpy.createRole).not.toHaveBeenCalled();
      expect(roleServiceSpy.updateRole).not.toHaveBeenCalled();
    });

    it('should not save if already saving', () => {
      component.isSaving = true;
      // Make form valid
      component.roleForm.setValue({ name: 'Test', color: '#FFF', permissions: [EPermission.DASHBOARD_VIEW] });
      component.onSave();
      expect(roleServiceSpy.createRole).not.toHaveBeenCalled();
      expect(roleServiceSpy.updateRole).not.toHaveBeenCalled();
    });
    
    it('should select a color and update the form', () => {
      const newColor = '#f44336';
      component.selectColor(newColor);
      expect(component.roleForm.get('color')?.value).toBe(newColor);
    });
    
    it('should format permission strings correctly', () => {
      const formatted = component.formatPermission(EPermission.ROLES_CREATE);
      expect(formatted).toBe('Roles - Create');
    });

    it('should close the dialog on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});
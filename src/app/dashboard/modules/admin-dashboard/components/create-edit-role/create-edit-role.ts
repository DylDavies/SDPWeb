import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RoleNode, RoleService } from '../../../../../services/role-service';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-create-edit-role',
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule,
    MatFormFieldModule, MatInputModule, MatSelectModule, MatProgressSpinnerModule,
    MatIconModule, MatTooltipModule
  ],
  templateUrl: './create-edit-role.html',
  styleUrl: './create-edit-role.scss'
})
export class CreateEditRole implements OnInit {
  private fb = inject(FormBuilder);
  private roleService = inject(RoleService);
  private snackbarService = inject(SnackBarService);
  public dialogRef = inject(MatDialogRef<CreateEditRole>);
  public data: { parentId: string | null; role?: RoleNode } = inject(MAT_DIALOG_DATA);

  public roleForm: FormGroup;
  public isSaving = false;
  public allPermissions = Object.values(EPermission);
  public presetColors = [
    '#673ab7', '#3f51b5', '#2196f3', '#00bcd4', '#009688', '#4caf50',
    '#8bc34a', '#cddc39', '#ffeb3b', '#ffc107', '#ff9800', '#f44336'
  ];
  public parentRoleName$: Observable<string | null> = of(null);

  constructor() {
    let initialColor = this.data.role?.color || this.presetColors[0];
    if (initialColor && initialColor.length === 9 && initialColor.startsWith('#')) {
      initialColor = initialColor.slice(0, 7);
    }

    this.roleForm = this.fb.group({
      name: [this.data.role?.name || '', [Validators.required, Validators.maxLength(20)]],
      color: [initialColor, Validators.required],
      permissions: [this.data.role?.permissions || [], Validators.required]
    });
  }

  ngOnInit(): void {
    // If we are creating a new role as a child of another, find the parent's name to display
    if (this.data.parentId && !this.data.role) {
      this.parentRoleName$ = this.roleService.getRoleTree().pipe(
        map(rootNode => {
          if (!rootNode) return null;
          const parentNode = this.findNodeById(rootNode, this.data.parentId!);
          return parentNode ? parentNode.name : null;
        })
      );
    }
  }

  /**
   * Recursively finds a role node by its ID within the role tree.
   * @param node The current node to search from.
   * @param id The ID of the node to find.
   * @returns The found RoleNode or null.
   */
  private findNodeById(node: RoleNode, id: string): RoleNode | null {
    if (node._id === id) {
      return node;
    }
    if (node.children) {
      for (const child of node.children) {
        const found = this.findNodeById(child, id);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }

  selectColor(color: string): void {
    this.roleForm.get('color')?.setValue(color);
  }

  formatPermission(permission: string): string {
    return permission.replace(/_/g, ' ').replace(/:/g, ' - ').replace(/\b\w/g, l => l.toUpperCase());
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.roleForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;
    
    const isEditing = !!this.data.role;
    const formData = { ...this.roleForm.value, _id: this.data.role?._id, parent: this.data.role?.parent };

    const apiCall = isEditing
      ? this.roleService.updateRole(formData)
      : this.roleService.createRole({ ...formData, parent: this.data.parentId });

    apiCall.subscribe({
      next: () => {
        const action = isEditing ? 'updated' : 'created';
        this.snackbarService.showSuccess(`Role "${formData.name}" ${action} successfully.`);
        this.dialogRef.close(true);
      },
      error: (err) => {
        const action = isEditing ? 'update' : 'create';
        this.snackbarService.showError(`Failed to ${action} role.`);
        console.error(err);
        this.isSaving = false;
      }
    });
  }
}


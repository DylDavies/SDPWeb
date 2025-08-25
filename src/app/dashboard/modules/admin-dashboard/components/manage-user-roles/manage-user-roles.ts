import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatDividerModule } from '@angular/material/divider';
import { Observable, map, startWith, tap } from 'rxjs';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { AuthService } from '../../../../../services/auth-service';
import { NotificationService } from '../../../../../services/notification-service';
import { RoleService, RoleNode } from '../../../../../services/role-service';
import { UserService } from '../../../../../services/user-service';

@Component({
  selector: 'app-manage-user-roles',
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatProgressSpinnerModule,
    MatIconModule, MatTreeModule, MatCheckboxModule, MatDividerModule
  ],
  templateUrl: './manage-user-roles.html',
  styleUrl: './manage-user-roles.scss'
})
export class ManageUserRolesDialog implements OnInit {
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<ManageUserRolesDialog>);
  public data: { targetUser: IUser, currentUser: IUser } = inject(MAT_DIALOG_DATA);

  public state$!: Observable<{ loading: boolean; assignableRoles: RoleNode[] }>;
  private targetUserRoles = new Set<string>(this.data.targetUser.roles.map(r => r._id));

  public treeControl = new NestedTreeControl<RoleNode>(node => node.children);
  public dataSource = new MatTreeNestedDataSource<RoleNode>();
  hasChild = (node: RoleNode) => !!node.children && node.children.length > 0;

  ngOnInit(): void {
    this.state$ = this.roleService.getRoleTree().pipe(
      map(rootRole => {
        const allRolesMap = new Map<string, RoleNode>();
        this.flattenTreeToMap(rootRole, allRolesMap);

        let treeData: RoleNode[];
        let assignableRoles: RoleNode[];

        if (this.authService.hasPermission(EPermission.ROLES_CREATE)) {
          treeData = rootRole ? [rootRole] : [];
          assignableRoles = Array.from(allRolesMap.values());
        } else {
          const currentUserRoleIds = new Set(this.data.currentUser.roles.map(r => r._id));
          const assignableRoleIds = new Set<string>();
          currentUserRoleIds.forEach(roleId => {
            const userRoleNode = allRolesMap.get(roleId);
            if (userRoleNode) {
              this.getDescendantIds(userRoleNode, assignableRoleIds);
            }
          });
          assignableRoles = Array.from(assignableRoleIds).map(id => allRolesMap.get(id)!).filter(Boolean);
          treeData = this.buildTreeFromAssignable(assignableRoles);
        }
        // Return all the data needed for the next step
        return { loading: false, assignableRoles, treeData };
      }),
      tap(({ treeData }) => {
        // Set the data for both the data source and the tree control
        this.dataSource.data = treeData;
        this.treeControl.dataNodes = treeData;
        
        // Use setTimeout to ensure the tree has rendered before we expand it
        setTimeout(() => {
          if (this.treeControl.dataNodes && this.treeControl.dataNodes.length > 0) {
            this.treeControl.expandAll();
          }
        });
      }),
      startWith({ loading: true, assignableRoles: [], treeData: [] })
    );
  }

  private flattenTreeToMap(node: RoleNode, map: Map<string, RoleNode>): void {
    map.set(node._id, node);
    if (node.children) {
      node.children.forEach(child => this.flattenTreeToMap(child, map));
    }
  }

  private getDescendantIds(node: RoleNode, descendantIds: Set<string>): void {
    if (node.children) {
      for (const child of node.children) {
        descendantIds.add(child._id);
        this.getDescendantIds(child, descendantIds);
      }
    }
  }

  // Helper to build a tree structure containing only the roles the current user can assign
  private buildTreeFromAssignable(assignableRoles: RoleNode[]): RoleNode[] {
      const assignableMap = new Map<string, RoleNode>(assignableRoles.map(r => [r._id, {...r, children: []}]));
      const tree: RoleNode[] = [];

      assignableMap.forEach(node => {
        if (node.parent && assignableMap.has(node.parent.toString())) {
          assignableMap.get(node.parent.toString())!.children.push(node);
        } else {
          tree.push(node);
        }
      });
      return tree;
  }

  isRoleAssigned(roleId: string): boolean {
    return this.targetUserRoles.has(roleId);
  }

  toggleRole(node: RoleNode, isChecked: boolean): void {
    if (isChecked) {
      this.assignRole(node._id);
    } else {
      this.removeRole(node._id);
    }
  }

  private assignRole(roleId: string): void {
    this.userService.assignRoleToUser(this.data.targetUser._id, roleId).subscribe({
      next: (updatedUser) => {
        this.notificationService.showSuccess('Role assigned successfully.');
        this.targetUserRoles = new Set(updatedUser.roles.map(r => r._id));
        this.data.targetUser = updatedUser;
      },
      error: () => this.notificationService.showError('Failed to assign role.')
    });
  }

  private removeRole(roleId: string): void {
    this.userService.removeRoleFromUser(this.data.targetUser._id, roleId).subscribe({
      next: (updatedUser) => {
        this.notificationService.showSuccess('Role removed successfully.');
        this.targetUserRoles = new Set(updatedUser.roles.map(r => r._id));
        this.data.targetUser = updatedUser;
      },
      error: () => this.notificationService.showError('Failed to remove role.')
    });
  }

  onClose(): void {
    this.dialogRef.close();
  }
}

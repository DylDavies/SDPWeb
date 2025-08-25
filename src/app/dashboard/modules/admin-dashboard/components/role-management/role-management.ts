import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { Observable, BehaviorSubject } from 'rxjs';
import { filter, switchMap, tap } from 'rxjs/operators';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { AuthService } from '../../../../../services/auth-service';
import { RoleService, RoleNode } from '../../../../../services/role-service';
import { CreateEditRole } from '../create-edit-role/create-edit-role';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { NotificationService } from '../../../../../services/notification-service';

@Component({
  selector: 'app-role-management',
  imports: [
    CommonModule, MatTreeModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule
  ],
  templateUrl: './role-management.html',
  styleUrl: './role-management.scss'
})
export class RoleManagement implements OnInit {
  private roleService = inject(RoleService);
  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private notificationService = inject(NotificationService);

  private refreshTree$ = new BehaviorSubject<void>(undefined);
  public roleTree$!: Observable<RoleNode>;

  public treeControl = new NestedTreeControl<RoleNode>(node => node.children);
  public dataSource = new MatTreeNestedDataSource<RoleNode>();
  hasChild = (node: RoleNode) => !!node.children && node.children.length > 0;

  public canCreateRoles = this.authService.hasPermission(EPermission.ROLES_CREATE);
  public canEditRoles = this.authService.hasPermission(EPermission.ROLES_EDIT);
  public canDeleteRoles = this.authService.hasPermission(EPermission.ROLES_DELETE);

  ngOnInit(): void {
    this.roleTree$ = this.refreshTree$.pipe(
      switchMap(() => this.roleService.getRoleTree()),
      tap(rootNode => {
        this.dataSource.data = rootNode ? [rootNode] : [];
        this.treeControl.dataNodes = rootNode ? [rootNode] : [];

        if (rootNode) {
          this.treeControl.expandAll()
        }
      })
    );
  }

  openCreateRoleDialog(parentId: string | null = null): void {
    const dialogRef = this.dialog.open(CreateEditRole, {
      width: 'clamp(400px, 80vw, 500px)',
      data: { parentId, role: null }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.refreshTree$.next(); }
    });
  }

  openEditRoleDialog(role: RoleNode): void {
    const dialogRef = this.dialog.open(CreateEditRole, {
      width: 'clamp(400px, 80vw, 500px)',
      data: { parentId: role.parent, role: role }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) { this.refreshTree$.next(); }
    });
  }

  deleteRole(node: RoleNode): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Role',
        message: `Are you sure you want to delete the "${node.name}" role? This action cannot be undone.`,
        confirmText: 'Delete'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.roleService.deleteRole(node._id).subscribe({
        next: () => {
          this.notificationService.showSuccess(`Role "${node.name}" deleted successfully.`);
          this.refreshTree$.next();
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to delete role.');
        }
      });
    });
  }
}

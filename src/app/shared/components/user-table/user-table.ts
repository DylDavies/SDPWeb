import { Component, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription, combineLatest, startWith } from 'rxjs';
import { EPermission } from '../../../models/enums/permission.enum';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { UserTypePipe } from '../../../pipes/usertype-pipe';
import { ManageUserRolesDialog } from '../../../dashboard/modules/admin-dashboard/components/manage-user-roles/manage-user-roles';
import { NotificationService } from '../../../services/notification-service';
import { EUserType } from '../../../models/enums/user-type.enum';
import { MatMenuModule } from '@angular/material/menu';
import { RoleChipRow } from '../../../dashboard/components/role-chip-row/role-chip-row';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { RoleNode, RoleService } from '../../../services/role-service';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-user-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, UserTypePipe, MatMenuModule,
    RoleChipRow, MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatSelectModule, ReactiveFormsModule, MatDialogModule
  ],
  templateUrl: './user-table.html',
  styleUrl: './user-table.scss'
})
export class UserTable implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private roleService = inject(RoleService);
  private userService = inject(UserService);
  private router = inject(Router);


  public dataSource = new MatTableDataSource<IUser>();
  public displayedColumns: string[] = ['avatar', 'displayName', 'userType', 'roles'];
  public canManageRoles = false;
  public isAdminView = false;
  public types = Object.values(EUserType);
  public currentUser: IUser | null = null;
  public isLoading = true;

  public allRoles: RoleNode[] = [];
  public roleFilterControl = new FormControl<string[]>([]);
  public textFilterControl = new FormControl<string>('');

  private subscriptions = new Subscription();

  private paginator!: MatPaginator;
  private sort!: MatSort;

  @ViewChild(MatPaginator) set matPaginator(mp: MatPaginator) {
    this.paginator = mp;
    this.dataSource.paginator = this.paginator;
  }

  @ViewChild(MatSort) set matSort(ms: MatSort) {
    this.sort = ms;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'displayName': return item.displayName.toLowerCase();
        case 'userType': return item.type;
        default: return 0;
      }
    };
  }

  ngOnInit(): void {
    this.isAdminView = this.authService.hasPermission(EPermission.ADMIN_DASHBOARD_VIEW);
    this.canManageRoles = this.authService.hasPermission(EPermission.USERS_MANAGE_ROLES);

    if (this.isAdminView || this.canManageRoles) {
      if (this.displayedColumns.indexOf('actions') === -1) {
        this.displayedColumns.push('actions');
      }
    }

    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => this.currentUser = user)
    );
      
    this.subscriptions.add(
        this.userService.allUsers$.subscribe(users => {
            this.dataSource.data = users;
            this.isLoading = false;
        })
    );

    this.roleService.getRoleTree().subscribe(rootNode => {
      if(rootNode)
        this.allRoles = this.flattenTree(rootNode);
    });

    this.setupFiltering();
    this.userService.fetchAllUsers().subscribe();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupFiltering(): void {
    const textFilter$ = this.textFilterControl.valueChanges.pipe(startWith(''));
    const roleFilter$ = this.roleFilterControl.valueChanges.pipe(startWith([]));

    this.subscriptions.add(
      combineLatest([textFilter$, roleFilter$]).subscribe(([text, roles]) => {
        this.dataSource.filter = JSON.stringify({ text: text?.toLowerCase(), roles });
      })
    );

    this.dataSource.filterPredicate = (data: IUser, filter: string): boolean => {
      const { text, roles } = JSON.parse(filter);

      const textMatch = (
        data.displayName.toLowerCase().includes(text) ||
        data.email.toLowerCase().includes(text) ||
        (data.pending && 'pending'.includes(text)) ||
        (data.disabled && 'disabled'.includes(text)) ||
        data.roles.some(r => r.name.toLowerCase().includes(text))
      );

      const roleMatch = roles.length === 0 || roles.every((roleId: string) => 
        data.roles.some(userRole => userRole._id === roleId)
      );

      return textMatch && roleMatch;
    };
  }

  private flattenTree(node: RoleNode): RoleNode[] {
    let result: RoleNode[] = [node];
    if (node.children) {
      node.children.forEach(child => {
        result = result.concat(this.flattenTree(child));
      });
    }
    return result;
  }

  manageRoles(user: IUser, event: MouseEvent): void {
    event.stopPropagation();
    if (!this.currentUser) return;
    this.dialog.open(ManageUserRolesDialog, {
      width: 'clamp(400px, 80vw, 600px)',
      data: { targetUser: user, currentUser: this.currentUser }
    });
  }

  approveUser(user: IUser, event: MouseEvent): void {
    event.stopPropagation();
    this.userService.approveUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} approved.`);
    });
  }

  disableUser(user: IUser, event: MouseEvent): void {
    event.stopPropagation();
    this.userService.disableUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} disabled.`);
    });
  }

  enableUser(user: IUser, event: MouseEvent): void {
    event.stopPropagation();
    this.userService.enableUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} enabled.`);
    });
  }

  updateUserType(user: IUser, type: EUserType, event: MouseEvent): void {
    event.stopPropagation();
    this.userService.updateUserType(user._id, type).subscribe(() => {
      this.notificationService.showSuccess(`${user.displayName}'s type updated to ${type}.`);
    });
  }

  viewProfile(user: IUser): void {
    this.router.navigate(['/dashboard/profile', user._id]);
  }
}
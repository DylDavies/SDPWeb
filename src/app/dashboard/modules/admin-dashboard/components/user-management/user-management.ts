import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { AuthService } from '../../../../../services/auth-service';
import { UserService } from '../../../../../services/user-service';
import { UserTypePipe } from '../../../../../pipes/usertype-pipe';
import { ManageUserRolesDialog } from '../manage-user-roles/manage-user-roles';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService } from '../../../../../services/notification-service';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { MatMenuModule } from '@angular/material/menu';
import { RoleChipRow } from '../../../../components/role-chip-row/role-chip-row';


@Component({
  selector: 'app-user-management',
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatChipsModule, MatTooltipModule, UserTypePipe, MatMenuModule,
    RoleChipRow
  ],
  templateUrl: './user-management.html',
  styleUrl: './user-management.scss'
})
export class UserManagement implements OnInit {
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  public users$: Observable<IUser[]> = this.userService.allUsers$;
  public displayedColumns: string[] = ['avatar', 'displayName', 'userType', 'roles', 'actions'];
  public canManageRoles = this.authService.hasPermission(EPermission.USERS_MANAGE_ROLES);

  public types = Object.values(EUserType);

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();
  }

  manageRoles(user: IUser): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    this.dialog.open(ManageUserRolesDialog, {
      width: 'clamp(400px, 80vw, 600px)',
      data: {
        targetUser: user,
        currentUser: currentUser
      }
    });
  }

  approveUser(user: IUser): void {
    this.userService.approveUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} approved.`);
    });
  }

  disableUser(user: IUser): void {
    this.userService.disableUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} disabled.`);
    });
  }

  enableUser(user: IUser): void {
    this.userService.enableUser(user._id).subscribe(() => {
      this.notificationService.showSuccess(`User ${user.displayName} enabled.`);
    });
  }

  updateUserType(user: IUser, type: EUserType): void {
    this.userService.updateUserType(user._id, type).subscribe(() => {
      this.notificationService.showSuccess(`${user.displayName}'s type updated to ${type}.`);
    });
  }
}

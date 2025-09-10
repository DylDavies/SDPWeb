import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { UserService } from '../../../services/user-service';
import { NotificationService } from '../../../services/notification-service';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-badge-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './badge-card.html',
  styleUrls: ['./badge-card.scss'],
})
export class BadgeCardComponent {
  @Input() badge!: IBadge;
  @Input() isAdminView = false;
  @Input() canManage = false;
  @Input() userId?: string;
  @Output() badgeUpdated = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService); // Inject AuthService

  viewDetails(): void {
    this.dialog.open(BadgeDetailDialogComponent, {
      width: '400px',
      data: { badge: this.badge },
    });
  }

  editBadge(): void {
    const dialogRef = this.dialog.open(CreateEditBadgeDialogComponent, {
      width: '500px',
      data: { badge: this.badge },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.badgeUpdated.emit();
      }
    });
  }

  removeBadgeFromUser(): void {
    if (this.userId) {
      this.userService.removeBadgeFromUser(this.userId, this.badge._id.toString()).subscribe({
        next: (updatedUser: IUser) => {
          this.notificationService.showSuccess('Badge removed from user.');
          // Manually update the auth state with the fresh user object
          this.authService.updateCurrentUserState(updatedUser);
        },
        error: () => {
          this.notificationService.showError('Failed to remove badge.');
        }
      });
    }
  }
}
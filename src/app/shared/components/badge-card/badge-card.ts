import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { BadgeService } from '../../../services/badge-service';
import { UserService } from '../../../services/user-service';
import { NotificationService } from '../../../services/notification-service';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';

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

  // Change the above dont pass is admin and what not, do this using perms

  private dialog = inject(MatDialog);
  private badgeService = inject(BadgeService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

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
      this.userService.removeBadgeFromUser(this.userId, this.badge._id.toString()).subscribe(() => {
        this.notificationService.showSuccess('Badge removed from user.');
        this.badgeUpdated.emit();
      });
    }
  }
}
// src/app/shared/components/badge-card/badge-card.ts
import { Component, Input, Output, EventEmitter, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { UserService } from '../../../services/user-service';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';
import { AuthService } from '../../../services/auth-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { BadgeService } from '../../../services/badge-service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { filter } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BadgeRequirementDialogComponent } from '../badge-requirement-dialog/badge-requirement-dialog';
import { SnackBarService } from '../../../services/snackbar-service';
import { IUserBadge } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-badge-card',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './badge-card.html',
  styleUrls: ['./badge-card.scss'],
})
export class BadgeCardComponent implements OnInit {
  @Input() badge!: IBadge;
  @Input() userBadge!: IUserBadge;
  @Input() userId?: string;
  @Input() context: 'admin' | 'profile' | 'library' = 'profile';
  @Output() badgeUpdated = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);
  private authService = inject(AuthService);
  private badgeService = inject(BadgeService);

  public canCreateOrEditBadges = false;
  public canManageUserBadges = false;
  public canViewRequirements = false;
  public canManageRequirements = false;

  ngOnInit(): void {
    this.canCreateOrEditBadges = this.authService.hasPermission(EPermission.BADGES_CREATE);
    this.canManageUserBadges = this.authService.hasPermission(EPermission.BADGES_MANAGE);
    this.canViewRequirements = this.authService.hasPermission(EPermission.BADGES_VIEW_REQUIREMENTS);
    this.canManageRequirements = this.authService.hasPermission(EPermission.BADGES_MANAGE_REQUIREMENTS);
  }

  viewDetails(): void {
    this.dialog.open(BadgeDetailDialogComponent, {
      width: '400px',
      data: { badge: this.badge, userBadge: this.userBadge },
    });
  }

  openRequirementsDialog(): void {
    this.dialog.open(BadgeRequirementDialogComponent, {
      width: 'clamp(500px, 50vw, 600px)',
      data: {
        badge: this.badge,
        isEditable: this.context === 'admin' && this.canManageRequirements
      }
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

  deleteBadge(): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Badge',
        message: `Are you sure you want to permanently delete the "${this.badge.name}" badge? This will not remove it from users who have already earned it, but it will no longer be available to award.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.badgeService.deleteBadge(this.badge._id).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Badge deleted successfully.');
          this.badgeUpdated.emit();
        },
        error: (err) => {
          this.snackbarService.showError(err.error?.message || 'Failed to delete badge.');
        }
      });
    });
  }

  removeBadgeFromUser(): void {
    if (this.userId) {
      this.userService.removeBadgeFromUser(this.userId, this.badge._id.toString()).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Badge removed from user.');
        },
        error: () => {
          this.snackbarService.showError('Failed to remove badge.');
        }
      });
    }
  }
}
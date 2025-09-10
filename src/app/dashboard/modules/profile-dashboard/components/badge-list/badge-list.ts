import { Component, Input, OnDestroy, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { BadgeCardComponent } from '../../../../../shared/components/badge-card/badge-card';
import { AuthService } from '../../../../../services/auth-service';
import { EPermission } from '../../../../../models/enums/permission.enum';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { AddUserBadgeDialogComponent } from '../../../../../shared/components/add-user-badge-dialog/add-user-badge-dialog';
import { Subscription } from 'rxjs';
import { BadgeService } from '../../../../../services/badge-service';
import { NotificationService } from '../../../../../services/notification-service';
import { UserService } from '../../../../../services/user-service';

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule, BadgeCardComponent, MatButtonModule, MatIconModule],
  templateUrl: './badge-list.html',
  styleUrls: ['./badge-list.scss'],
})
export class BadgeListComponent implements OnInit, OnDestroy {
  @Input() user: IUser | null = null;
  @Output() userUpdated = new EventEmitter<void>();

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private badgeService = inject(BadgeService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);

  public canManageBadges = false;
  public badges: IBadge[] = [];
  
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.canManageBadges = this.authService.hasPermission(EPermission.BADGES_MANAGE);
    this.userSubscription = this.authService.currentUser$.subscribe((user) => {
        if (user?._id === this.user?._id) {
            this.badges = user!.badges || [];
        }
    });
    
    this.badges = this.user?.badges || [];
  }

  ngOnDestroy(): void {
    if(this.userSubscription) this.userSubscription.unsubscribe();
  }


  openAddBadgeDialog(): void {
    const dialogRef = this.dialog.open(AddUserBadgeDialogComponent, {
      width: '400px',
      data: { user: this.user },
    });

    dialogRef.afterClosed().subscribe((result: IBadge) => {
      if (result) {
        // This call is now valid because the service expects an IBadge object
        this.userService.addBadgeToUser(this.user!._id, result).subscribe(() => {
          this.notificationService.showSuccess('Badge added to user.');
          this.userUpdated.emit();
        });
      }
    });
  }
}
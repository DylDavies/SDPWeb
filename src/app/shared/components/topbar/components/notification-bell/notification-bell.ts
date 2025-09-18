import { Component, inject, OnInit } from '@angular/core';
import { NotificationService } from '../../../../../services/notification-service';
import { Router } from '@angular/router';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { CommonModule } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';
import { INotification } from '../../../../../models/interfaces/INotification.interface';
import { ThemeService } from '../../../../../services/theme-service';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-notification-bell',
  standalone: true,
  imports: [
    CommonModule,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    MatBadgeModule,
    MatTooltipModule
  ],
  templateUrl: 'notification-bell.html',
  styleUrls: ['notification-bell.scss']
})
export class NotificationBell implements OnInit {
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  public themeService = inject(ThemeService);
  private snackbarService = inject(SnackBarService);

  public notifications: INotification[] = [];
  public unreadCount = 0;
  public theme: 'light' | 'dark' | null = null;

  constructor() {
    this.notificationService.allNotifications$.subscribe({
      next: (value) => {
        this.notifications = value;

        this.unreadCount = this.notifications.filter(n => !n.read).length
      }
    })
  }

  ngOnInit(): void {
    this.themeService.themeObs.subscribe((theme) => {
      this.theme = theme;
    });
  }

  markAsRead(notification: INotification, event?: MouseEvent) {
    event?.stopPropagation(); // Prevent the menu from closing
    if (!notification.read) {
        this.notificationService.markAsRead(notification._id).subscribe();
    }
  }

  deleteNotification(notification: INotification, event: MouseEvent) {
    event.stopPropagation();
    this.notificationService.deleteNotification(notification._id).subscribe(() => {
      const snackBarRef = this.snackbarService.showWithAction('Notification deleted', 'Undo');

      snackBarRef.onAction().subscribe(() => {
        this.notificationService.restoreNotification(notification._id).subscribe();
      });
    });
  }

  viewAllNotifications() {
    this.router.navigate(['/dashboard/notifications']);
  }
}


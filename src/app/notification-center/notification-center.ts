import { Component, inject } from '@angular/core';
import { NotificationService } from '../services/notification-service';
import { INotification } from '../models/interfaces/INotification.interface';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { AsyncPipe, DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { SnackBarService } from '../services/snackbar-service';

@Component({
  selector: 'app-notification-center',
  templateUrl: './notification-center.html',
  styleUrls: ['./notification-center.scss'],
  imports: [
    MatCardModule, MatIconModule, DatePipe, AsyncPipe, MatButtonModule
  ]
})
export class NotificationCenterComponent {
  private snackbarService = inject(SnackBarService);
  private notificationService = inject(NotificationService);

  public allNotifications$: Observable<INotification[]>;

  constructor() {
    this.allNotifications$ = this.notificationService.allNotifications$;
  }

  markAsRead(notification: INotification, event?: MouseEvent) {
    event?.stopPropagation();
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

  markAllAsRead() {
    this.notificationService.markAllAsRead().subscribe();
  }

  clearAllRead() {
    this.notificationService.deleteAllRead().subscribe();
  }
}

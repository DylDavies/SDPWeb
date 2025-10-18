import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { INotification } from '../models/interfaces/INotification.interface';
import { AuthService } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private httpService = inject(HttpService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private notifications$ = new BehaviorSubject<INotification[]>([]);
  public allNotifications$ = this.notifications$.asObservable();
  private socketListenerSetup = false;

  constructor() {
    // Setup socket listener when socket is connected (only in browser)
    if (this.isBrowser) {
      this.setupSocketListener();
    }

    // When user logs in, fetch their notifications
    this.authService.currentUser$.subscribe(user => {
        if (user) {
            this.fetchNotifications().subscribe();
        } else {
            this.notifications$.next([]); // Clear notifications on logout
        }
    })
  }

  /**
   * Sets up the socket listener for notification updates.
   * This is called either immediately if socket is connected, or deferred via connection hook.
   */
  private setupSocketListener() {
    if (this.socketListenerSetup) return;

    if (this.socketService.isSocketConnected()) {
      this.socketService.listen<INotification>(ESocketMessage.NotificationsUpdated).subscribe(() => {
        this.fetchNotifications().subscribe();
      });
      this.socketListenerSetup = true;
    } else {
      // Wait for socket to connect before setting up listener
      this.socketService.connectionHook(() => {
        if (!this.socketListenerSetup) {
          this.socketService.listen<INotification>(ESocketMessage.NotificationsUpdated).subscribe(() => {
            this.fetchNotifications().subscribe();
          });
          this.socketListenerSetup = true;
        }
      });
    }
  }

  /**
   * Fetches all notifications for the current user from the API.
   */
  public fetchNotifications(): Observable<INotification[]> {
    return this.httpService.get<INotification[]>('user/notifications').pipe(
        tap(notifications => this.notifications$.next(notifications))
    );
  }

  /**
   * Marks a single notification as read.
   * @param notificationId The ID of the notification to mark as read.
   */
  public markAsRead(notificationId: string): Observable<INotification> {
    return this.httpService.patch<INotification>(`user/notifications/${notificationId}/read`, {});
  }

  /**
   * Deletes a specific notification.
   * @param notificationId The ID of the notification to delete.
   */
  public deleteNotification(notificationId: string): Observable<unknown> {
    return this.httpService.delete(`user/notifications/${notificationId}`);
  }

  public markAllAsRead(): Observable<unknown> {
    return this.httpService.patch("user/notifications/read-all", {});
  }

  public deleteAllRead(): Observable<unknown> {
    return this.httpService.delete("user/notifications/read");
  }

  public restoreNotification(notificationId: string): Observable<INotification> {
    return this.httpService.patch<INotification>(`user/notifications/${notificationId}/restore`, {});
  }
}

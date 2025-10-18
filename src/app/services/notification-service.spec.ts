import { TestBed } from '@angular/core/testing';
import { BehaviorSubject, of } from 'rxjs';
import { NotificationService } from './notification-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { AuthService } from './auth-service';
import { INotification } from '../models/interfaces/INotification.interface';
import { ESocketMessage } from '../models/enums/socket-message.enum';

describe('NotificationService', () => {
  let service: NotificationService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let currentUserSubject: BehaviorSubject<any>;

  const mockNotifications: INotification[] = [
    {
      _id: 'notif-1',
      recipientId: 'user-123',
      title: 'Test Title 1',
      message: 'Test notification 1',
      read: false,
      createdAt: new Date()
    },
    {
      _id: 'notif-2',
      recipientId: 'user-123',
      title: 'Test Title 2',
      message: 'Test notification 2',
      read: true,
      createdAt: new Date()
    }
  ];

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'patch', 'delete']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'isSocketConnected', 'connectionHook']);
    currentUserSubject = new BehaviorSubject(null);
    const authSpy = jasmine.createSpyObj('AuthService', [], {
      currentUser$: currentUserSubject.asObservable()
    });

    socketSpy.listen.and.returnValue(of({}));
    socketSpy.isSocketConnected.and.returnValue(false);
    socketSpy.connectionHook.and.callFake((cb: () => void) => cb());
    httpSpy.get.and.returnValue(of(mockNotifications));

    TestBed.configureTestingModule({
      providers: [
        NotificationService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    service = TestBed.inject(NotificationService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should listen to notifications-updated socket events', () => {
    expect(socketServiceSpy.listen).toHaveBeenCalledWith(ESocketMessage.NotificationsUpdated);
  });

  describe('fetchNotifications', () => {
    it('should fetch notifications from API', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockNotifications));

      service.fetchNotifications().subscribe((notifications) => {
        expect(notifications).toEqual(mockNotifications);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('user/notifications');
        done();
      });
    });

    it('should update notifications$ BehaviorSubject', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockNotifications));

      service.fetchNotifications().subscribe(() => {
        service.allNotifications$.subscribe((notifications) => {
          expect(notifications).toEqual(mockNotifications);
          expect(notifications.length).toBe(2);
          done();
        });
      });
    });

    it('should handle empty notifications', (done) => {
      httpServiceSpy.get.and.returnValue(of([]));

      service.fetchNotifications().subscribe((notifications) => {
        expect(notifications).toEqual([]);
        done();
      });
    });
  });

  describe('markAsRead', () => {
    it('should mark a notification as read', (done) => {
      const notificationId = 'notif-1';
      const readNotification = { ...mockNotifications[0], read: true };

      httpServiceSpy.patch.and.returnValue(of(readNotification));

      service.markAsRead(notificationId).subscribe((notification) => {
        expect(notification.read).toBe(true);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `user/notifications/${notificationId}/read`,
          {}
        );
        done();
      });
    });

    it('should handle marking multiple notifications as read', (done) => {
      httpServiceSpy.patch.and.returnValue(of(mockNotifications[0]));

      service.markAsRead('notif-1').subscribe(() => {
        service.markAsRead('notif-2').subscribe(() => {
          expect(httpServiceSpy.patch).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  describe('deleteNotification', () => {
    it('should delete a notification', (done) => {
      const notificationId = 'notif-1';

      httpServiceSpy.delete.and.returnValue(of({}));

      service.deleteNotification(notificationId).subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(
          `user/notifications/${notificationId}`
        );
        done();
      });
    });

    it('should handle deleting multiple notifications', (done) => {
      httpServiceSpy.delete.and.returnValue(of({}));

      service.deleteNotification('notif-1').subscribe(() => {
        service.deleteNotification('notif-2').subscribe(() => {
          expect(httpServiceSpy.delete).toHaveBeenCalledTimes(2);
          done();
        });
      });
    });
  });

  describe('user authentication integration', () => {
    it('should fetch notifications when user logs in', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockNotifications));

      currentUserSubject.next({ _id: 'user-123', name: 'Test User' });

      setTimeout(() => {
        expect(httpServiceSpy.get).toHaveBeenCalledWith('user/notifications');
        done();
      }, 10);
    });

    it('should clear notifications when user logs out', (done) => {
      currentUserSubject.next(null);

      setTimeout(() => {
        service.allNotifications$.subscribe((notifications) => {
          expect(notifications).toEqual([]);
          done();
        });
      }, 10);
    });
  });
});

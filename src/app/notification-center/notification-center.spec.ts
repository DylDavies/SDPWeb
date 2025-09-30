import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, Subject } from 'rxjs';
import { NotificationCenterComponent } from './notification-center';
import { NotificationService } from '../services/notification-service';
import { SnackBarService } from '../services/snackbar-service';
import { INotification } from '../models/interfaces/INotification.interface';
import { MatSnackBarRef } from '@angular/material/snack-bar';

describe('NotificationCenterComponent', () => {
  let component: NotificationCenterComponent;
  let fixture: ComponentFixture<NotificationCenterComponent>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  const mockNotifications: INotification[] = [
    { _id: '1', title: 'Unread', message: 'Message 1', read: false, createdAt: new Date(), recipientId: 'user1' },
    { _id: '2', title: 'Read', message: 'Message 2', read: true, createdAt: new Date(), recipientId: 'user1' },
  ];

  beforeEach(async () => {
    mockNotificationService = jasmine.createSpyObj('NotificationService', [
      'markAsRead', 'deleteNotification', 'restoreNotification', 'markAllAsRead', 'deleteAllRead'
    ], {
      allNotifications$: of(mockNotifications)
    });
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showWithAction']);

    await TestBed.configureTestingModule({
      imports: [NotificationCenterComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NotificationCenterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and subscribe to notifications', () => {
    expect(component).toBeTruthy();
    component.allNotifications$.subscribe(notifications => {
      expect(notifications.length).toBe(2);
      expect(notifications[0].title).toBe('Unread');
    });
  });

  describe('markAsRead', () => {
    it('should call notificationService.markAsRead if the notification is unread', () => {
      const unreadNotification = mockNotifications[0];
      mockNotificationService.markAsRead.and.returnValue(of(unreadNotification));
      
      component.markAsRead(unreadNotification);
      
      expect(mockNotificationService.markAsRead).toHaveBeenCalledWith(unreadNotification._id);
    });

    it('should NOT call notificationService.markAsRead if the notification is already read', () => {
      const readNotification = mockNotifications[1];
      
      component.markAsRead(readNotification);
      
      expect(mockNotificationService.markAsRead).not.toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    it('should call deleteNotification and show snackbar with Undo action', () => {
      const notificationToDelete = mockNotifications[0];
      const mockSnackBarRef = { onAction: () => of() } as unknown as MatSnackBarRef<any>;
      mockSnackbarService.showWithAction.and.returnValue(mockSnackBarRef);
      mockNotificationService.deleteNotification.and.returnValue(of({}));
      
      component.deleteNotification(notificationToDelete, new MouseEvent('click'));
      
      expect(mockNotificationService.deleteNotification).toHaveBeenCalledWith(notificationToDelete._id);
      expect(mockSnackbarService.showWithAction).toHaveBeenCalledWith('Notification deleted', 'Undo');
    });

    it('should call restoreNotification when Undo action is triggered', () => {
      const notificationToDelete = mockNotifications[0];
      const onActionSubject = new Subject<void>();
      const mockSnackBarRef = { onAction: () => onActionSubject.asObservable() } as MatSnackBarRef<any>;
      
      mockSnackbarService.showWithAction.and.returnValue(mockSnackBarRef);
      mockNotificationService.deleteNotification.and.returnValue(of({}));
      mockNotificationService.restoreNotification.and.returnValue(of(notificationToDelete));

      component.deleteNotification(notificationToDelete, new MouseEvent('click'));

      onActionSubject.next();

      expect(mockNotificationService.restoreNotification).toHaveBeenCalledWith(notificationToDelete._id);
    });
  });

  describe('markAllAsRead', () => {
    it('should call notificationService.markAllAsRead', () => {
      mockNotificationService.markAllAsRead.and.returnValue(of({}));
      component.markAllAsRead();
      expect(mockNotificationService.markAllAsRead).toHaveBeenCalled();
    });
  });

  describe('clearAllRead', () => {
    it('should call notificationService.deleteAllRead', () => {
      mockNotificationService.deleteAllRead.and.returnValue(of({}));
      component.clearAllRead();
      expect(mockNotificationService.deleteAllRead).toHaveBeenCalled();
    });
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NotificationService } from '../../../../../services/notification-service';
import { of } from 'rxjs';

import { NotificationBell } from './notification-bell';
import { INotification } from '../../../../../models/interfaces/INotification.interface';

describe('NotificationBell', () => {
  let component: NotificationBell;
  let fixture: ComponentFixture<NotificationBell>;
  let notificationService: jasmine.SpyObj<NotificationService>;

  const mockNotification: INotification = {
    _id: '1',
    recipientId: 'user1',
    title: 'Test',
    message: 'Test message',
    read: false,
    createdAt: new Date()
  };

  beforeEach(async () => {
    const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['markAsRead']);
    notificationServiceSpy.allNotifications$ = of([]);

    await TestBed.configureTestingModule({
      imports: [NotificationBell],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: NotificationService, useValue: notificationServiceSpy }
      ]
    })
    .compileComponents();

    notificationService = TestBed.inject(NotificationService) as jasmine.SpyObj<NotificationService>;
    fixture = TestBed.createComponent(NotificationBell);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('markAsRead', () => {
    it('should call notificationService.markAsRead when notification is unread', () => {
      const unreadNotification: INotification = { ...mockNotification, read: false };
      notificationService.markAsRead.and.returnValue(of(unreadNotification));

      component.markAsRead(unreadNotification);

      expect(notificationService.markAsRead).toHaveBeenCalledWith('1');
    });

    it('should not call notificationService.markAsRead when notification is already read', () => {
      const readNotification: INotification = { ...mockNotification, read: true };

      component.markAsRead(readNotification);

      expect(notificationService.markAsRead).not.toHaveBeenCalled();
    });
  });
});

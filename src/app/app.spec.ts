import { TestBed } from '@angular/core/testing';
import { Router, NavigationEnd } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { PLATFORM_ID } from '@angular/core';
import { Subject } from 'rxjs';

import { App } from './app';
import { SocketService } from './services/socket-service';
import { ThemeService } from './services/theme-service';
import { NotificationService } from './services/notification-service';

describe('App', () => {
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let mockThemeService: jasmine.SpyObj<ThemeService>;
  let mockNotificationService: jasmine.SpyObj<NotificationService>;
  let mockRouter: { events: Subject<any> };

  beforeEach(async () => {
    mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'isSocketConnected']);
    mockThemeService = jasmine.createSpyObj('ThemeService', ['init']);
    mockNotificationService = jasmine.createSpyObj('NotificationService', ['init']);
    mockRouter = {
      events: new Subject()
    };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: SocketService, useValue: mockSocketService },
        { provide: ThemeService, useValue: mockThemeService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: Router, useValue: mockRouter },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  describe('Socket initialization on navigation', () => {
    it('should not connect socket on landing page', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to landing page
      mockRouter.events.next(new NavigationEnd(1, '/', '/'));

      expect(mockSocketService.connect).not.toHaveBeenCalled();
    });

    it('should not connect socket on empty route', () => {
      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to empty route
      mockRouter.events.next(new NavigationEnd(1, '', ''));

      expect(mockSocketService.connect).not.toHaveBeenCalled();
    });

    it('should connect socket when navigating to dashboard', () => {
      mockSocketService.isSocketConnected.and.returnValue(false);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to dashboard
      mockRouter.events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    it('should connect socket when navigating to any non-landing page', () => {
      mockSocketService.isSocketConnected.and.returnValue(false);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to various routes
      mockRouter.events.next(new NavigationEnd(1, '/admin/users', '/admin/users'));

      expect(mockSocketService.connect).toHaveBeenCalled();
    });

    it('should not connect socket if already connected', () => {
      mockSocketService.isSocketConnected.and.returnValue(true);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to dashboard
      mockRouter.events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      expect(mockSocketService.connect).not.toHaveBeenCalled();
    });

    it('should only connect socket once even after multiple navigations', () => {
      mockSocketService.isSocketConnected.and.returnValues(false, true, true);

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // First navigation - should connect
      mockRouter.events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));
      expect(mockSocketService.connect).toHaveBeenCalledTimes(1);

      // Second navigation - should not connect
      mockRouter.events.next(new NavigationEnd(2, '/admin/users', '/admin/users'));
      expect(mockSocketService.connect).toHaveBeenCalledTimes(1);

      // Third navigation - should not connect
      mockRouter.events.next(new NavigationEnd(3, '/staff', '/staff'));
      expect(mockSocketService.connect).toHaveBeenCalledTimes(1);
    });

    it('should log when initializing socket', () => {
      mockSocketService.isSocketConnected.and.returnValue(false);
      spyOn(console, 'log');

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation to dashboard
      mockRouter.events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      expect(console.log).toHaveBeenCalledWith('Navigated away from landing page, initializing Socket.IO...');
    });

    it('should not run socket initialization in non-browser environment', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [App],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          provideRouter([]),
          { provide: SocketService, useValue: mockSocketService },
          { provide: ThemeService, useValue: mockThemeService },
          { provide: NotificationService, useValue: mockNotificationService },
          { provide: Router, useValue: mockRouter },
          { provide: PLATFORM_ID, useValue: 'server' } // Server platform
        ]
      });

      const fixture = TestBed.createComponent(App);
      fixture.detectChanges();

      // Simulate navigation
      mockRouter.events.next(new NavigationEnd(1, '/dashboard', '/dashboard'));

      // Should not connect in server environment
      expect(mockSocketService.connect).not.toHaveBeenCalled();
    });
  });
});

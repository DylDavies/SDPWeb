import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { RendererFactory2 } from '@angular/core';
import { Subject, of, throwError } from 'rxjs';
import { ThemeService, Theme } from './theme-service';
import { AuthService } from './auth-service';
import { UserService } from './user-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';

// --- Mock Data ---
const mockUser: IUser = {
  _id: '1', displayName: 'Test User', email: 'active@test.com',
  pending: false, disabled: false, type: EUserType.Staff, roles: [], permissions: [],
  picture: '', createdAt: new Date(), firstLogin: false, googleId: '', theme: 'dark', leave: [],
  paymentType: 'Contract' as const,
  monthlyMinimum: 0,
  rateAdjustments: []
};

// --- Mock Services and Dependencies ---
const mockAuthService = {
  currentUser$: new Subject<IUser | null>(),
  // Add currentUserValue to the mock to match the AuthService implementation
  currentUserValue: null as IUser | null 
};

const mockUserService = {
  updateUserPreferences: (prefs: { theme: Theme }) => of({ success: true })
};

const mockRenderer = {
  addClass: jasmine.createSpy('addClass'),
  removeClass: jasmine.createSpy('removeClass')
};

const mockRendererFactory = {
  createRenderer: () => mockRenderer
};

describe('ThemeService', () => {
  let service: ThemeService;
  let mediaQueryList: MediaQueryList;

  // Helper function to set up the testing module
  const configureTestingModule = () => {
    TestBed.configureTestingModule({
      providers: [
        ThemeService,
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: RendererFactory2, useValue: mockRendererFactory }
      ]
    });
  };

  beforeEach(() => {
    // Spy on window.matchMedia before each test
    mediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    spyOn(window, 'matchMedia').and.returnValue(mediaQueryList);
    
    // Reset spies
    mockRenderer.addClass.calls.reset();
    mockRenderer.removeClass.calls.reset();
    // Reset the mock user value
    mockAuthService.currentUserValue = null;
  });

  describe('with default localStorage', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(localStorage, 'setItem').and.stub();
      configureTestingModule();
      service = TestBed.inject(ThemeService);
    });

    it('should be created and default to "system" theme', () => {
      expect(service).toBeTruthy();
      expect(service.theme()).toBe('system');
    });
  });

  describe('with "dark" theme in localStorage', () => {
    beforeEach(() => {
      // This setup ensures localStorage is mocked *before* the service is created for this block
      spyOn(localStorage, 'getItem').and.returnValue('dark');
      spyOn(localStorage, 'setItem').and.stub();
      configureTestingModule();
      service = TestBed.inject(ThemeService);
    });

    it('should initialize from localStorage with the correct theme', () => {
      expect(service.theme()).toBe('dark');
    });
  });

  describe('Database Syncing', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(localStorage, 'setItem').and.stub();
      configureTestingModule();
      service = TestBed.inject(ThemeService);
    });

    it('should sync theme from the database when a user logs in', fakeAsync(() => {
      service.setTheme('light');
      tick();
      expect(service.theme()).toBe('light');

      (mockAuthService.currentUser$ as Subject<IUser | null>).next(mockUser);
      tick();

      expect(service.theme()).toBe('dark');
    }));
  });

  describe('Error Handling', () => {
    beforeEach(() => {
      spyOn(localStorage, 'getItem').and.returnValue(null);
      spyOn(localStorage, 'setItem').and.stub();
      configureTestingModule();
      service = TestBed.inject(ThemeService);
    });

    it('should handle error when updating user preferences fails', () => {
      spyOn(console, 'error');
      spyOn(mockUserService, 'updateUserPreferences').and.returnValue(
        throwError(() => new Error('API Error'))
      );

      service.setTheme('dark');

      expect(console.error).toHaveBeenCalledWith('Failed to save theme preference:', jasmine.any(Error));
    });
  });

});

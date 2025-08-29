import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AuthService } from './auth-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { EPermission } from '../models/enums/permission.enum';


// A complete mock user for testing purposes
const mockUser: IUser = {
  _id: 'user-123',
  googleId: 'google-123',
  email: 'test@tutorcore.com',
  displayName: 'Test User',
  type: EUserType.Staff,
  picture: 'http://example.com/pic.jpg',
  firstLogin: false,
  createdAt: new Date(),
  roles: [],
  permissions: [EPermission.DASHBOARD_VIEW],
  pending: false,
  disabled: false,
  leave: [],
};

const MOCK_TOKEN = 'mock-jwt-token';

// Create mock objects for all dependencies
const httpServiceSpy = jasmine.createSpyObj('HttpService', ['get', 'post']);
const routerSpy = jasmine.createSpyObj('Router', ['navigate']);
// The SocketService mock needs a `listen` method that returns an observable we can control
const socketServiceSpy = {
  listen: (_eventName: string): Observable<unknown> => {
    // We'll use a simple Subject for testing socket emissions
    return new Subject<unknown>().asObservable();
  }
};

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpService, useValue: httpServiceSpy },
        { provide: Router, useValue: routerSpy },
        { provide: SocketService, useValue: socketServiceSpy }
      ]
    });

    service = TestBed.inject(AuthService);

    // Reset spies and mocks before each test
    httpServiceSpy.get.calls.reset();
    httpServiceSpy.post.calls.reset();
    routerSpy.navigate.calls.reset();
    spyOn(localStorage, 'getItem').and.returnValue(null);
    spyOn(localStorage, 'setItem').and.stub();
    spyOn(localStorage, 'removeItem').and.stub();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // Helper function to get the current user from the service's internal subject
  const getCurrentUser = () => {
    // @ts-expect-error Used as any to access private member
    return service.currentUserSubject.getValue();
  };

  describe('getToken', () => {
    it('should call localStorage.getItem with the correct key', () => {
      service.getToken();
      expect(localStorage.getItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
    });
  });

  describe('verifyCurrentUser', () => {
    it('should return null and not call API if no token exists', () => {
      service.verifyCurrentUser().subscribe(result => {
        expect(result).toBeNull();
        expect(httpServiceSpy.get).not.toHaveBeenCalled();
      });
    });

    it('should call the API and update the user when a token exists', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(of(mockUser));

      service.verifyCurrentUser().subscribe(result => {
        expect(result).toEqual(mockUser);
      });

      expect(httpServiceSpy.get).toHaveBeenCalledOnceWith('user');
      expect(getCurrentUser()).toEqual(mockUser);
    });

    it('should remove the token and set user to null if the API call fails', () => {
      (localStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(throwError(() => new Error('401 Unauthorized')));

      service.verifyCurrentUser().subscribe(result => {
        expect(result).toBeNull();
      });

      expect(httpServiceSpy.get).toHaveBeenCalledOnceWith('user');
      expect(localStorage.removeItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
      expect(getCurrentUser()).toBeNull();
    });
  });

  describe('logout', () => {
    it('should remove token, call logout endpoint, and navigate to root', () => {
      httpServiceSpy.post.and.returnValue(of({ status: 'success' }));

      service.logout();

      expect(localStorage.removeItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
      expect(getCurrentUser()).toBeNull();
      expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('auth/logout', {});
      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/']);
    });
  });

  describe('updateCurrentUserState', () => {
    it('should update the currentUserSubject with the new user data', () => {
      const newUser: IUser = { ...mockUser, displayName: 'Updated Name' };
      service.updateCurrentUserState(newUser);
      expect(getCurrentUser()).toEqual(newUser);
    });
  });

  describe('hasPermission', () => {
    it('should return true if user has the specific permission', () => {
      service.updateCurrentUserState(mockUser);
      expect(service.hasPermission(EPermission.DASHBOARD_VIEW)).toBeTrue();
    });

    it('should return false if user does not have the permission', () => {
      service.updateCurrentUserState(mockUser);
      expect(service.hasPermission(EPermission.ROLES_CREATE)).toBeFalse();
    });

    it('should return true if user is an Admin, regardless of permissions array', () => {
      const adminUser: IUser = { ...mockUser, type: EUserType.Admin, permissions: [] };
      service.updateCurrentUserState(adminUser);
      expect(service.hasPermission(EPermission.ROLES_CREATE)).toBeTrue();
    });

    it('should return false if there is no user', () => {
      expect(service.hasPermission(EPermission.DASHBOARD_VIEW)).toBeFalse();
    });
  });
});

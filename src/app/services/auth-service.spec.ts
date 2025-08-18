import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { AuthService } from './auth-service';
import { HttpService } from './http-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserRole } from '../models/enums/user-role.enum';

// A sample user object to use in our tests
const mockUser: IUser = {
  id: 'user-123',
  email: 'test@tutorcore.com',
  displayName: 'Test User',
  role: EUserRole.User,
  picture: 'http://example.com/pic.jpg'
};

const MOCK_TOKEN = 'mock-jwt-token';

describe('AuthService', () => {
  let service: AuthService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get']);
    const navSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: HttpService, useValue: httpSpy },
        { provide: Router, useValue: navSpy }
      ]
    });

    // Inject the service and its mocked dependencies
    service = TestBed.inject(AuthService);
    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    spyOn(sessionStorage, 'getItem').and.returnValue(null);
    spyOn(sessionStorage, 'setItem').and.returnValue(undefined);
    spyOn(sessionStorage, 'removeItem').and.returnValue(undefined);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getToken', () => {
    it('should call sessionStorage.getItem with the correct key', () => {
      service.getToken();
      expect(sessionStorage.getItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
    });
  });

  describe('saveToken', () => {
    it('should call sessionStorage.setItem with the correct key and token', () => {
      service.saveToken(MOCK_TOKEN);
      expect(sessionStorage.setItem).toHaveBeenCalledOnceWith('tutorcore-auth-token', MOCK_TOKEN);
    });

    it('should reset the verification cache after saving a token', () => {
      // Arrange: Prime the cache by calling verifyCurrentUser once
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(of(mockUser));
      service.verifyCurrentUser().subscribe();
      expect(httpServiceSpy.get).toHaveBeenCalledTimes(1);

      // Act: Save a new token
      service.saveToken('new-token');
      
      // Assert: The next call to verifyCurrentUser should trigger a new API call
      service.verifyCurrentUser().subscribe();
      expect(httpServiceSpy.get).toHaveBeenCalledTimes(2);
    });
  });

  describe('verifyCurrentUser', () => {
    it('should do nothing and return null if no token exists in storage', () => {
      // Act
      service.verifyCurrentUser().subscribe(result => {
        // Assert
        expect(result).toBeNull();
        expect(httpServiceSpy.get).not.toHaveBeenCalled();
      });
    });

    it('should call the API and update the user when a token exists', () => {
      // Arrange
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(of(mockUser));

      // Act
      service.verifyCurrentUser().subscribe(result => {
        // Assert
        expect(result).toEqual(mockUser);
      });

      // Assert: Use the new getter
      expect(httpServiceSpy.get).toHaveBeenCalledOnceWith('user');
      expect(service.currentUserValue).toEqual(mockUser);
    });

    it('should remove the token and set user to null if the API call fails', () => {
      // Arrange
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(throwError(() => new Error('401 Unauthorized')));

      // Act
      service.verifyCurrentUser().subscribe(result => {
        // Assert
        expect(result).toBeNull();
      });

      // Assert: Use the new getter
      expect(httpServiceSpy.get).toHaveBeenCalledOnceWith('user');
      expect(sessionStorage.removeItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
      expect(service.currentUserValue).toBeNull();
    });

    it('should return a cached observable on subsequent calls', () => {
      // Arrange
      (sessionStorage.getItem as jasmine.Spy).and.returnValue(MOCK_TOKEN);
      httpServiceSpy.get.and.returnValue(of(mockUser));

      // Act
      service.verifyCurrentUser().subscribe();
      service.verifyCurrentUser().subscribe(); // Call a second time

      // Assert
      expect(httpServiceSpy.get).toHaveBeenCalledOnceWith('user');
    });
  });

  describe('logout', () => {
    it('should remove the token, clear the user, and navigate to the root', () => {
      // Act
      service.logout();

      // Assert: Use the new getter
      expect(sessionStorage.removeItem).toHaveBeenCalledOnceWith('tutorcore-auth-token');
      expect(service.currentUserValue).toBeNull();
      expect(routerSpy.navigate).toHaveBeenCalledOnceWith(['/']);
    });
  });
});
import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { authGuard } from './auth-guard';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';

// --- Mock Data ---
const mockUser: IUser = {
  _id: '1', displayName: 'Active User', email: 'active@test.com',
  pending: false, disabled: false, type: EUserType.Staff, roles: [], permissions: [],
  picture: '', createdAt: new Date(), firstLogin: false, googleId: '', theme: 'system', leave: []
};

// --- Mock Services ---
const mockAuthService = {
  // We will spy on this method and control its return value in each test
  verifyCurrentUser: () => of<IUser | null>(null)
};

const mockRouter = {
  createUrlTree: (commands: any[]) => new UrlTree()
};

describe('authGuard', () => {
  // Helper function to execute the guard within Angular's dependency injection context
  const executeGuard = (): Observable<boolean | UrlTree> => {
    const route: any = {}; // Mock ActivatedRouteSnapshot
    const state: any = {}; // Mock RouterStateSnapshot
    return TestBed.runInInjectionContext(() => authGuard(route, state)) as Observable<boolean>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow activation when the user is authenticated', fakeAsync(() => {
    // Arrange: Tell the mock service to return a valid user
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(mockUser));
    let result: boolean | UrlTree = false;

    // Act
    executeGuard().subscribe(res => {
      result = res;
    });
    tick(); // Wait for the observable to complete

    // Assert
    expect(result).toBe(true);
  }));

  it('should deny activation and redirect to root when the user is not authenticated', fakeAsync(() => {
    // Arrange: Tell the mock service to return null
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(null));
    spyOn(mockRouter, 'createUrlTree').and.callThrough();
    let result: boolean | UrlTree = false;

    // Act
    executeGuard().subscribe(res => {
      result = res;
    });
    tick();

    // Assert
    expect(result).toBeInstanceOf(UrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/']);
  }));
});

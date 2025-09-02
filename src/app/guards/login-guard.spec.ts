import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { loginGuard } from './login-guard';

// --- Mock Services ---
const mockAuthService = {
  // We will spy on this method and control its return value in each test
  getToken: () => null as string | null
};

const mockRouter = {
  // We will spy on this method to see if it gets called
  navigateByUrl: (url: string) => Promise.resolve(true)
};

describe('loginGuard', () => {
  // Helper function to execute the guard within Angular's dependency injection context
  const executeGuard = (): boolean | UrlTree => {
    const route: any = {}; // Mock ActivatedRouteSnapshot
    const state: any = {}; // Mock RouterStateSnapshot
    return TestBed.runInInjectionContext(() => loginGuard(route, state)) as boolean;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should deny activation and redirect to dashboard if a token exists', () => {
    // Arrange: Tell the mock service to return a token
    spyOn(mockAuthService, 'getToken').and.returnValue('mock-token');
    spyOn(mockRouter, 'navigateByUrl').and.callThrough();

    // Act
    const result = executeGuard();

    // Assert
    expect(result).toBe(false);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/dashboard');
  });

  it('should allow activation if no token exists', () => {
    // Arrange: Ensure the mock service returns null
    spyOn(mockAuthService, 'getToken').and.returnValue(null);
    spyOn(mockRouter, 'navigateByUrl').and.callThrough();

    // Act
    const result = executeGuard();

    // Assert
    expect(result).toBe(true);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });
});

import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { permissionGuard } from './permission-guard';
import { EPermission } from '../models/enums/permission.enum';

// --- Mock Services ---
const mockAuthService = {
  // We will spy on this method to control its return value for different permissions
  hasPermission: (permission: EPermission) => false
};

const mockRouter = {
  createUrlTree: (commands: any[]) => new UrlTree()
};

describe('permissionGuard', () => {
  // Helper function to execute the guard within an injection context
  const executeGuard = (permissions: EPermission[], requireAll = false): boolean | UrlTree => {
    const route: any = {}; // Mock ActivatedRouteSnapshot
    const state: any = {}; // Mock RouterStateSnapshot
    return TestBed.runInInjectionContext(() => permissionGuard(permissions, requireAll)(route, state)) as boolean;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  describe('when requireAll is false (default)', () => {
    it('should allow activation if the user has at least one of the required permissions', () => {
      // Arrange: User has one of the two required permissions
      spyOn(mockAuthService, 'hasPermission').and.callFake((p: EPermission) => p === EPermission.USERS_VIEW);

      // Act
      const result = executeGuard([EPermission.USERS_VIEW, EPermission.ROLES_CREATE]);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny activation if the user has none of the required permissions', () => {
      // Arrange: User has no permissions
      spyOn(mockAuthService, 'hasPermission').and.returnValue(false);
      spyOn(mockRouter, 'createUrlTree').and.callThrough();

      // Act
      const result = executeGuard([EPermission.USERS_VIEW, EPermission.ROLES_CREATE]);

      // Assert
      expect(result).toBeInstanceOf(UrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });
  });

  describe('when requireAll is true', () => {
    it('should allow activation if the user has ALL of the required permissions', () => {
      // Arrange: User has both required permissions
      spyOn(mockAuthService, 'hasPermission').and.returnValue(true);

      // Act
      const result = executeGuard([EPermission.USERS_VIEW, EPermission.ROLES_CREATE], true);

      // Assert
      expect(result).toBe(true);
    });

    it('should deny activation if the user has only some (but not all) of the required permissions', () => {
      // Arrange: User has only one of the two required permissions
      spyOn(mockAuthService, 'hasPermission').and.callFake((p: EPermission) => p === EPermission.USERS_VIEW);
      spyOn(mockRouter, 'createUrlTree').and.callThrough();

      // Act
      const result = executeGuard([EPermission.USERS_VIEW, EPermission.ROLES_CREATE], true);

      // Assert
      expect(result).toBeInstanceOf(UrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });

    it('should deny activation if the user has none of the required permissions', () => {
      // Arrange: User has no permissions
      spyOn(mockAuthService, 'hasPermission').and.returnValue(false);
      spyOn(mockRouter, 'createUrlTree').and.callThrough();

      // Act
      const result = executeGuard([EPermission.USERS_VIEW, EPermission.ROLES_CREATE], true);

      // Assert
      expect(result).toBeInstanceOf(UrlTree);
      expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
    });
  });
});

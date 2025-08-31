import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { EPermission } from '../models/enums/permission.enum';
import { NotificationService } from '../services/notification-service';

/**
 * Creates a route guard that checks if the current user has at least one or all of the required permissions.
 * @param requiredPermissions An array of permissions to check against.
 * @param requireAll Whether or not all permissions are required.
 * @returns A CanActivateFn function.
 */
export function permissionGuard(requiredPermissions: EPermission[], requireAll = false): CanActivateFn {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const notification = inject(NotificationService);

    // Check if the user has any of the permissions in the array
    const hasPermission = requireAll ? requiredPermissions.every(p => authService.hasPermission(p)) : requiredPermissions.some(p => authService.hasPermission(p));

    if (hasPermission) {
      return true;
    }

    notification.showError("You do not have the required permissions to access that page.");

    // User does not have the required permissions, redirect to the main dashboard.
    return router.createUrlTree(['/dashboard']);
  };
}

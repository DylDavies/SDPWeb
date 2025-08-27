import { inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { Observable, map } from 'rxjs';

/**
 * Guard to redirect pending or disabled users to their respective pages
 */
export const accountStatusGuard: CanActivateFn = (
  route: ActivatedRouteSnapshot,
  state: RouterStateSnapshot
): Observable<boolean> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.currentUser$.pipe(
    map(user => {
      // If there's no user, the main authGuard will handle it. We can allow it.
      if (!user) {
        return true;
      }

      const allowedRoutes = ['/account/pending', '/account/disabled'];
      const isTryingToAccessStatusPage = allowedRoutes.includes(state.url);

      // Handle disabled users
      if (user.disabled) {
        if (state.url == "/account/disabled") {
          return true;
        }

        router.navigate(["/account/disabled"]);
        return false;
      }
      
      // Handle pending users
      if (user.pending) {
        if (state.url == "/account/pending") {
          return true;
        }
        router.navigate(["/account/pending"]);
        return false;
      }

      // If the user is active (not pending or disabled) but is trying
      // to access a status page, redirect them to the dashboard.
      if (isTryingToAccessStatusPage) {
        router.navigate(['/dashboard']);
        return false;
      }

      // If the user is active and not trying to access a status page, allow navigation.
      return true;
    })
  );
};

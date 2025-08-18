import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth-service';

export const loginGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('[LoginGuard] Running check. Token exists?', !!authService.getToken());

  if (authService.getToken()) {
    // Token exists, so the user is logged in. Redirect them away from the login page.
    router.navigate(['/dashboard']);
    return false;
  }

  // No token, so allow them to see the login page.
  return true;
};
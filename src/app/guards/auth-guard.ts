import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { AuthService } from '../services/auth-service';
import { Observable, map } from 'rxjs';

export const authGuard: CanActivateFn = (): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.verifyCurrentUser().pipe(
    map(user => {
      if (user) {
        return true;
      }
      return router.createUrlTree(['/']);
    })
  );
};
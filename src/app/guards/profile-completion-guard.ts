import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../services/auth-service';
import { ProfileUpdateModal } from '../shared/components/profile-update-modal/profile-update-modal';
import { map, switchMap, of } from 'rxjs';

export const profileCompletionGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const dialog = inject(MatDialog);

  return authService.verifyCurrentUser().pipe(
    switchMap(user => {
      if (user && user.firstLogin) {
        const dialogRef = dialog.open(ProfileUpdateModal, {
          width: 'clamp(300px, 90vw, 500px)',
          maxWidth: '95vw',
          disableClose: true,
          backdropClass: 'image-backdrop'
        });

        return dialogRef.afterClosed().pipe(
          map(updatedUser => {
            if (updatedUser) {
              authService.updateCurrentUserState(updatedUser);
            }

            return true;
          })
        );
      }
      
      return of(true);
    })
  );
};
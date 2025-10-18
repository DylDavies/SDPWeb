import { DOCUMENT, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, of, catchError, tap, shareReplay, startWith, pairwise } from 'rxjs';
import { Router } from '@angular/router';
import { IUser } from '../models/interfaces/IUser.interface';
import { HttpService } from './http-service';
import { EPermission } from '../models/enums/permission.enum';
import { EUserType } from '../models/enums/user-type.enum';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { SidebarService } from './sidebar-service';

export const TOKEN_STORAGE_KEY = 'tutorcore-auth-token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private verification$: Observable<IUser | null> | null = null;

  private httpService = inject(HttpService);
  private router = inject(Router);
  private socketService = inject(SocketService);
  private sidebarService = inject(SidebarService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private document = inject(DOCUMENT);
  private window = this.document.defaultView;
  private socketListenerSetup = false;

  constructor() {
    this.socketService.connectionHook(() => {
      const token = this.getToken();

      if (token) this.socketService.authenticate(token);
    });

    // Setup socket listeners when socket is connected (only in browser)
    if (this.isBrowser) {
      this.setupSocketListeners();
    }

    this.currentUser$.pipe(
      startWith(null),
      pairwise()
    ).subscribe(([previousUser, currentUser]) => {
      if (previousUser && currentUser) {
        const statusChanged = previousUser.disabled !== currentUser.disabled || previousUser.pending !== currentUser.pending;

        if (statusChanged) {
          console.log('Critical user status changed. Forcing a page reload to re-evaluate guards.');
          // Force a hard reload of the page.
          this.window?.location.reload();
        }
      }
    })
  }

  /**
   * Sets up the socket listeners for user, role, and badge updates.
   * This is called either immediately if socket is connected, or deferred via connection hook.
   */
  private setupSocketListeners() {
    if (this.socketListenerSetup) return;

    if (this.socketService.isSocketConnected()) {
      this.socketService.listen(ESocketMessage.UsersUpdated).subscribe(() => {
        console.log('Received users-updated event. Refreshing logged in user.');
        this.verification$ = null; // Force re-verification
        this.verifyCurrentUser().subscribe();
      });

      this.socketService.listen(ESocketMessage.RolesUpdated).subscribe(() => {
        console.log('Received roles-updated event. Refreshing logged in user.');
        this.verification$ = null; // Force re-verification
        this.verifyCurrentUser().subscribe();
      });

      // Listen for changes with the badges
      this.socketService.listen(ESocketMessage.BadgesUpdated).subscribe(() => {
        console.log('Received badges-updated event. Refreshing logged in user.');
        this.verification$ = null; // Force re-verification
        this.verifyCurrentUser().subscribe();
      });
      this.socketListenerSetup = true;
    } else {
      // Wait for socket to connect before setting up listeners
      this.socketService.connectionHook(() => {
        if (!this.socketListenerSetup) {
          this.socketService.listen(ESocketMessage.UsersUpdated).subscribe(() => {
            console.log('Received users-updated event. Refreshing logged in user.');
            this.verification$ = null; // Force re-verification
            this.verifyCurrentUser().subscribe();
          });

          this.socketService.listen(ESocketMessage.RolesUpdated).subscribe(() => {
            console.log('Received roles-updated event. Refreshing logged in user.');
            this.verification$ = null; // Force re-verification
            this.verifyCurrentUser().subscribe();
          });

          // Listen for changes with the badges
          this.socketService.listen(ESocketMessage.BadgesUpdated).subscribe(() => {
            console.log('Received badges-updated event. Refreshing logged in user.');
            this.verification$ = null; // Force re-verification
            this.verifyCurrentUser().subscribe();
          });
          this.socketListenerSetup = true;
        }
      });
    }
  }

  getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  saveToken(token: string): void {
    if (!this.isBrowser) return;
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.verification$ = null; // Force re-verification on next check
  }

  removeToken(): void {
    if (!this.isBrowser) return;
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.verification$ = null;

    this.sidebarService.clearCache();
  }

  verifyCurrentUser(): Observable<IUser | null> {
    if (this.verification$) {
      return this.verification$;
    }

    const token = this.getToken();
    if (!token) {
      this.verification$ = of(null);
      return this.verification$;
    }

    this.verification$ = this.httpService.get<IUser>('user').pipe(
      tap(user => {
        this.currentUserSubject.next(user);
        
        this.socketService.authenticate(token);

        this.sidebarService.fetchAndCacheSidebarItems();
      }),
      catchError(() => {
        this.removeToken();
        return of(null);
      }),
      shareReplay(1)
    );

    return this.verification$;
  }

  logout(): void {
    this.removeToken();
    this.httpService.post('auth/logout', {}).subscribe({
      next: () => {
        this.router.navigateByUrl('/');
      },
      error: (err) => {
        console.error('Logout API call failed:', err);
        // Token is already removed, so we can still navigate to root
        this.router.navigateByUrl('/');
      }
    })
  }

  public updateCurrentUserState(updatedUser: IUser): void {
    this.currentUserSubject.next(updatedUser);
  }

  /**
   * Checks if the currently logged-in user has a specific permission.
   * @param permission The permission to check for.
   * @returns `true` if the user has the permission, otherwise `false`.
   */
  public hasPermission(permission: EPermission): boolean {
    const user = this.currentUserSubject.getValue();
    return (user?.permissions?.includes(permission) ?? false) || (user?.type == EUserType.Admin);
  }
}
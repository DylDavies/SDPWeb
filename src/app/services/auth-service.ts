import { DOCUMENT, inject, Injectable } from '@angular/core';
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

  private document = inject(DOCUMENT);
  private window = this.document.defaultView;

  constructor() {
    this.socketService.connectionHook(() => {
      const token = this.getToken();

      if (token) this.socketService.authenticate(token);
    })

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

    // Listen for changes with the badgse 
    this.socketService.listen(ESocketMessage.BadgesUpdated).subscribe(() =>{
      console.log('Received badges-updated event. Refreshing logged in user.');
      this.verification$ = null; // Force re-verification
      this.verifyCurrentUser().subscribe();
    })

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

  getToken(): string | null {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  saveToken(token: string): void {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.verification$ = null; // Force re-verification on next check
  }

  removeToken(): void {
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
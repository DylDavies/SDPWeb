import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, catchError, tap, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { IUser } from '../models/interfaces/IUser.interface';
import { HttpService } from './http-service';
import { EPermission } from '../models/enums/permission.enum';
import { EUserType } from '../models/enums/user-type.enum';

const TOKEN_STORAGE_KEY = 'tutorcore-auth-token';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<IUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private verification$: Observable<IUser | null> | null = null;

  private httpService = inject(HttpService);
  private router = inject(Router);

  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY);
  }

  saveToken(token: string): void {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
    this.verification$ = null; // Force re-verification on next check
  }

  removeToken(): void {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    this.currentUserSubject.next(null);
    this.verification$ = null;
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
        this.router.navigate(['/']);
      }
    })
  }

  public updateCurrentUserState(updatedUser: IUser): void {
    this.currentUserSubject.next(updatedUser);
  }

  public get currentUserValue(): IUser | null {
    return this.currentUserSubject.getValue();
  }

  /**
   * Checks if the currently logged-in user has a specific permission.
   * @param permission The permission to check for.
   * @returns `true` if the user has the permission, otherwise `false`.
   */
  public hasPermission(permission: EPermission): boolean {
    const user = this.currentUserValue;
    return (user?.permissions?.includes(permission) ?? false) || (user?.type == EUserType.Admin);
  }
}
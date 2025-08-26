// src/app/services/user.service.ts
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public httpService = inject(HttpService);
  public socketService = inject(SocketService);

  private users$ = new BehaviorSubject<IUser[]>([]);

  /**
   * A public observable that components can subscribe to for the user list.
   */
  public allUsers$ = this.users$.asObservable();

  constructor() {
    this.socketService.listen(ESocketMessage.UsersUpdated).subscribe(() => {
      console.log('Received users-updated event. Refreshing user list.');
      this.fetchAllUsers().subscribe();
    });

    this.socketService.listen(ESocketMessage.RolesUpdated).subscribe(() => {
      console.log('Received roles-updated event. Refreshing user list to update roles.');
      this.fetchAllUsers().subscribe();
    });
  }

  /**
   * Fetches all users from the API and updates the state.
   * Any component subscribed to `allUsers$` will automatically receive the new data.
   */
  public fetchAllUsers(): Observable<IUser[]> {
    return this.httpService.get<IUser[]>('users').pipe(
      tap(users => this.users$.next(users))
    );
  }

  // This method gets the profile of the currently authenticated user.
  // Note: We already have this logic in AuthService for session management,
  // but it's good practice to have it here too if other parts of the app
  // need to explicitly fetch user data.
  getUser(): Observable<IUser> {
    return this.httpService.get<IUser>('user');
  }

  /**
   * Updates the profile of the currently logged-in user.
   * @param profileData The partial user data to update.
   * @returns An observable of the updated user.
   */
  updateProfile(data: Partial<IUser>): Observable<IUser> {
    return this.httpService.patch<IUser>('user', data);
  }

  /**
   * Assigns a specific role to a user.
   * @param userId The ID of the user to modify.
   * @param roleId The ID of the role to assign.
   * @returns An observable of the updated user.
   */
  assignRoleToUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/roles`, { roleId }).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  /**
   * Removes a specific role from a user.
   * @param userId The ID of the user to modify.
   * @param roleId The ID of the role to remove.
   * @returns An observable of the updated user.
   */
  removeRoleFromUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.delete<IUser>(`users/${userId}/roles/${roleId}`).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  approveUser(userId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/approve`, {}).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  disableUser(userId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/disable`, {}).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  enableUser(userId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/enable`, {}).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  updateUserType(userId: string, type: EUserType): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/type`, { type }).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }
}
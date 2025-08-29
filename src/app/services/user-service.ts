// src/app/services/user-service.ts

import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { ELeave } from '../models/enums/ELeave.enum';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { Theme } from './theme-service';


@Injectable({
  providedIn: 'root'
})
export class UserService {
  public httpService = inject(HttpService);
  public socketService = inject(SocketService);

  private users$ = new BehaviorSubject<IUser[]>([]);
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

  getUser(): Observable<IUser> {
    return this.httpService.get<IUser>('user');
  }

  updateProfile(data: Partial<IUser>): Observable<IUser> {
    return this.httpService.patch<IUser>('user', data);
  }

  assignRoleToUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/roles`, { roleId }).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  removeRoleFromUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.delete<IUser>(`users/${userId}/roles/${roleId}`).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

  /**
   * Submits a new leave request for a specific user.
   * @param userId The ID of the user requesting leave.
   * @param leaveData The details of the leave request.
   * @returns An observable of the updated user.
   */
  public requestLeave(userId: string, leaveData: { reason: string, startDate: Date, endDate: Date }): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/leave`, leaveData).pipe(
      tap(() => this.fetchAllUsers().subscribe()) // Refresh user data after request
    );
  }

  /**
   * NEW: Updates the status of a leave request (e.g., approve or deny).
   * @param userId The ID of the user whose leave request is being updated.
   * @param leaveId The ID of the specific leave request.
   * @param status The new status ('Approved' or 'Denied').
   * @returns An observable of the updated user.
   */
  public updateLeaveStatus(userId: string, leaveId: string, status: ELeave.Approved | ELeave.Denied): Observable<IUser> {
    return this.httpService.patch<IUser>(`users/${userId}/leave/${leaveId}`, { status }).pipe(
      tap(() => this.fetchAllUsers().subscribe()) // Refresh user list to reflect change
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

  updateUserPreferences(preferences: { theme: Theme }): Observable<unknown> {
    return this.httpService.patch('user/preferences', preferences);
  }
}
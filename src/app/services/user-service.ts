// src/app/services/user-service.ts

import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, map, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { ELeave } from '../models/enums/ELeave.enum';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { Theme } from './theme-service';
import { IBackendProficiency } from '../models/interfaces/IBackendProficiency.interface';
import { CustomObservableService } from './custom-observable-service';
import IBadge from '../models/interfaces/IBadge.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public httpService = inject(HttpService);
  public socketService = inject(SocketService);
  public observableService = inject(CustomObservableService);

  private users$ = new BehaviorSubject<IUser[]>([]);
  public allUsers$: Observable<IUser[]>;

  constructor() {
    this.socketService.listen(ESocketMessage.UsersUpdated).subscribe(() => {
      console.log('Received users-updated event. Refreshing user list.');
      this.fetchAllUsers().subscribe();
    });

    this.socketService.listen(ESocketMessage.RolesUpdated).subscribe(() => {
      console.log('Received roles-updated event. Refreshing user list to update roles.');
      this.fetchAllUsers().subscribe();
    });

    // Initialize the managed observable
    this.allUsers$ = this.observableService.createManagedTopicObservable(
      ESocketMessage.UsersUpdated,
      this.users$.asObservable(),
      () => this.fetchAllUsers()
    );
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
   * Gets a single user by ID, prioritizing the local cache.
   * This relies on the socket service to keep the user list fresh.
   * @param id The ID of the user to find.
   * @returns An observable of the user, or undefined if not found after fetching.
   */
  public getUserById(id: string): Observable<IUser | undefined> {
    return this.allUsers$.pipe(
        map(users => users.find(u => u._id === id)),
        tap(user => {
            if (!user) {
                this.fetchAllUsers().subscribe();
            }
        })
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
  public updateLeaveStatus(userId: string, leaveId: string, approved: ELeave.Approved | ELeave.Denied): Observable<IUser> {
    return this.httpService.patch<IUser>(`users/${userId}/leave/${leaveId}`, { approved }).pipe(
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

  /**
   * Sends proficiency data to the backend.
   * @param userId The ID of the user to update.
   * @param proficiencyData The proficiency data to save (using the backend-compatible interface).
   */
  updateUserProficiency(userId: string, proficiencyData: IBackendProficiency): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/proficiencies`, proficiencyData);
  }

  /**
   * Deletes a subject from a user's proficiency.
   * @param userId The ID of the user.
   * @param profName The name of the proficiency (e.g., "Cambridge").
   * @param subjectKey The id of the subject to delete.
   */
  deleteSubjectFromProficiency(userId: string, profName: string, subjectId: string): Observable<IUser> {
    return this.httpService.delete<IUser>(`users/${userId}/proficiencies/${profName}/subjects/${subjectId}`);
  }

  /**
   * Updates a user's weekly availability.
   * @param userId The ID of the user to update.
   * @param availability The new availability in hours.
   */
  updateUserAvailability(userId: string, availability: number): Observable<IUser> {
    return this.httpService.patch<IUser>(`users/${userId}/availability`, { availability });
  }

    /**
   * Assigns a badge to a specific user.
   * After a successful API call, it triggers a refresh of the local user list.
   * @param userId - The ID of the user to whom the badge will be added.
   * @param badgeData - The full badge object to be added.
   * @returns An Observable that emits the updated user document.
   */
  addBadgeToUser(userId: string, badgeData: IBadge): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/badges`, { badgeData }).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }

    /**
   * Removes a badge from a specific user.
   * After a successful API call, it triggers a refresh of the local user list.
   * @param userId - The ID of the user from whom the badge will be removed.
   * @param badgeId - The ID of the badge to remove.
   * @returns An Observable that emits the updated user document.
   */
  removeBadgeFromUser(userId: string, badgeId: string): Observable<IUser> {
    return this.httpService.delete<IUser>(`users/${userId}/badges/${badgeId}`).pipe(
      tap(() => this.fetchAllUsers().subscribe())
    );
  }
} 
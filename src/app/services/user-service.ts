// src/app/services/user.service.ts
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { IUser } from '../models/interfaces/IUser.interface';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  public httpService = inject(HttpService);

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
   * Fetches a list of all users from the API.
   * @returns An observable array of user objects.
   */
  getAllUsers(): Observable<IUser[]> {
    return this.httpService.get<IUser[]>('users');
  }

  /**
   * Assigns a specific role to a user.
   * @param userId The ID of the user to modify.
   * @param roleId The ID of the role to assign.
   * @returns An observable of the updated user.
   */
  assignRoleToUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.post<IUser>(`users/${userId}/roles`, { roleId });
  }

  /**
   * Removes a specific role from a user.
   * @param userId The ID of the user to modify.
   * @param roleId The ID of the role to remove.
   * @returns An observable of the updated user.
   */
  removeRoleFromUser(userId: string, roleId: string): Observable<IUser> {
    return this.httpService.delete<IUser>(`users/${userId}/roles/${roleId}`);
  }
}
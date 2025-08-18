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

  // Example of an update method
  updateProfile(data: Partial<IUser>): Observable<IUser> {
    return this.httpService.patch<IUser>('user', data);
  }
}
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { IAddress } from '../models/interfaces/IAddress.interface';
import { IProficiency } from '../models/interfaces/IProficiency.interface';

export interface MatchmakingCriteria {
  lessonLocation: IAddress;
  subject?: string;
  proficiency?: string;
  grade?: string;
  hoursPerWeek: number;
  maxDistance?: number;
}

export interface MatchedTutor {
  _id: string;
  displayName: string;
  email: string;
  address?: IAddress;
  proficiencies: IProficiency[];
  availability: number;
  distance: number | null;
  matchScore: number;
}

export interface MatchmakingResponse {
  criteria: MatchmakingCriteria;
  matchCount: number;
  tutors: MatchedTutor[];
}

@Injectable({
  providedIn: 'root'
})
export class MatchmakingService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/matchmaking`;

  /**
   * Finds tutors matching the specified criteria
   * @param criteria The search criteria
   * @returns Observable of matching tutors
   */
  findMatchingTutors(criteria: MatchmakingCriteria): Observable<MatchmakingResponse> {
    return this.http.post<MatchmakingResponse>(`${this.apiUrl}/find-tutors`, criteria);
  }
}

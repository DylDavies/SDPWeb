/**
 * @file This file defines the MissionService, which is responsible for all
 * interactions with the backend API related to student missions.
 */

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { EMissionStatus } from '../models/enums/mission-status.enum';
import { IMissions } from '../models/interfaces/IMissions.interface';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

/**
 * A service for managing missions.
 * This service provides methods to create, update, and manage missions
 * by making HTTP requests to the corresponding backend endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class MissionService {
  
  /**
   * We're using inject() to get an instance of our HttpService,
   * which will handle the actual HTTP requests.
   */
  private httpService = inject(HttpService);
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  /**
   * Retrieves all missions from the backend.
   * @returns An Observable that emits an array of missions.
   */
  getMissions(): Observable<IMissions[]> {
    return this.httpService.get<IMissions[]>('missions');
  }
  /**
   * Retrieves all missions for a specific student from the backend.
   * @param studentId The ID of the student.
   * @returns An Observable that emits an array of the student's missions.
   */
  getMissionsByStudentId(studentId: string): Observable<IMissions[]> {
    return this.httpService.get<IMissions[]>(`missions/student/${studentId}`);
  }

  getMissionsByBundleId(bundleId: string): Observable<IMissions[]> {
    return this.httpService.get<IMissions[]>(`missions/bundle/${bundleId}`);
  }

  /**
   * Retrieves a single mission by its unique ID.
   * @param id The ID of the mission to retrieve.
   * @returns An Observable that emits the requested mission.
   */
  getMissionById(id: string): Observable<IMissions> {
    return this.httpService.get<IMissions>(`missions/${id}`);
  }

  /**
   * Creates a new mission.
   * The commissionedBy field is handled automatically by the backend.
   * @param missionData The data for the new mission.
   * @returns An Observable that emits the newly created mission.
   */
  createMission(missionData: FormData): Observable<IMissions> {
    return this.http.post<IMissions>(`${this.apiUrl}/missions`, missionData);
  }

  downloadMissionDocument(filename: string): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/missions/document/${filename}`, {
      responseType: 'blob' // This is important for handling file downloads
    });
  }

  /**
   * Updates an existing mission with new data.
   * @param missionId The ID of the mission to update.
   * @param updateData An object with the fields to update.
   * @returns An Observable that emits the updated mission.
   */
  updateMission(missionId: string, updateData: Partial<IMissions>): Observable<IMissions> {
    return this.httpService.patch<IMissions>(`missions/${missionId}`, updateData);
  }

  /**
   * Updates the status of a mission (e.g., pending, completed).
   * @param missionId The ID of the mission to update.
   * @param status The new status to set.
   * @returns An Observable that emits the updated mission.
   */
  setMissionStatus(missionId: string, status: EMissionStatus): Observable<IMissions> {
    return this.httpService.patch<IMissions>(`missions/${missionId}/status`, { status });
  }

  /**
   * Deletes a mission by its ID.
   * @param missionId The ID of the mission to delete.
   * @returns An Observable that completes upon successful deletion.
   */
  deleteMission(missionId: string): Observable<void> {
    return this.httpService.delete<void>(`missions/${missionId}`);
  }
}
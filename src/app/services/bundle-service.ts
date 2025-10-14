/**
 * @file This file defines the BundleService, which is responsible for all
 * interactions with the backend API related to tutoring bundles.
 */

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { EBundleStatus } from '../models/enums/bundle-status.enum';
import { IBundleSubject, IBundle, IAddress } from '../models/interfaces/IBundle.interface';

/**
 * A service for managing tutoring bundles.
 * This service provides methods to create, update, and manage bundles
 * by making HTTP requests to the corresponding backend endpoints.
 */
@Injectable({
  providedIn: 'root'
})
export class BundleService {
  /**
   * We're using inject() to get an instance of our HttpService,
   * which will handle the actual HTTP requests.
   */
  private httpService = inject(HttpService);

  /**
   * Retrieves all bundles from the backend.
   * @returns An Observable that emits an array of bundles.
   */
  getBundles(): Observable<IBundle[]> {
    return this.httpService.get<IBundle[]>('bundle');
  }

  /**
   * Creates a new tutoring bundle.
   * This sends the student's ID and the list of subjects to the backend.
   * The creator is handled automatically by the backend using the user's auth token.
   * @param studentId The ID of the student for whom the bundle is being created.
   * @param subjects An array of subjects to include in the new bundle.
   * @param lessonLocation Optional structured address where lessons will take place.
   * @param managerId Optional ID of the staff member managing this bundle.
   * @param stakeholderIds Optional array of user IDs who are stakeholders in this bundle.
   * @returns An Observable that emits the newly created bundle.
   */
  createBundle(
    studentId: string,
    subjects: Partial<IBundleSubject>[],
    lessonLocation?: IAddress,
    managerId?: string,
    stakeholderIds?: string[]
  ): Observable<IBundle> {
    interface CreateBundlePayload {
      student: string;
      subjects: Partial<IBundleSubject>[];
      lessonLocation?: IAddress;
      manager?: string;
      stakeholders?: string[];
    }

    const payload: CreateBundlePayload = { student: studentId, subjects };
    if (lessonLocation) payload.lessonLocation = lessonLocation;
    if (managerId) payload.manager = managerId;
    if (stakeholderIds && stakeholderIds.length > 0) payload.stakeholders = stakeholderIds;
    return this.httpService.post<IBundle>('bundle', payload);
  }

  /**
   * Updates an existing bundle with new data.
   * @param bundleId The ID of the bundle to update.
   * @param updateData An object with the fields to update (e.g., { status: 'approved', subjects: [...] }).
   * @returns An Observable that emits the updated bundle.
   */
  updateBundle(bundleId: string, updateData: Partial<IBundle>): Observable<IBundle> {
    return this.httpService.patch<IBundle>(`bundle/${bundleId}`, updateData);
  }

  /**
   * Adds a new subject to an existing bundle.
   * @param bundleId The ID of the bundle to which the subject will be added.
   * @param subject The subject data to add.
   * @returns An Observable that emits the updated bundle.
   */
  addSubjectToBundle(bundleId: string, subject: Partial<IBundleSubject>): Observable<IBundle> {
    return this.httpService.post<IBundle>(`bundle/${bundleId}/subjects`, subject);
  }

  /**
   * Removes a subject from a specific bundle.
   * @param bundleId The ID of the bundle from which to remove the subject.
   * @param subjectId The ID of the subject entry to remove.
   * @returns An Observable that emits the updated bundle.
   */
   removeSubjectFromBundle(bundleId: string, subjectId: string): Observable<IBundle> {
    return this.httpService.delete<IBundle>(`bundle/${bundleId}/subjects/${subjectId}`);
  }

  /**
   * Sets the active status of a bundle.
   * A bundle can be marked as active (true) or inactive (false).
   * @param bundleId The ID of the bundle to update.
   * @param isActive The new active status.
   * @returns An Observable that emits the updated bundle.
   */
  setBundleActiveStatus(bundleId: string, isActive: boolean): Observable<IBundle> {
    return this.httpService.patch<IBundle>(`bundle/${bundleId}/status/active`, { isActive });
  }

  /**
   * Updates the overall status of a bundle (e.g., pending, approved).
   * @param bundleId The ID of the bundle to update.
   * @param status The new status to set.
   * @returns An Observable that emits the updated bundle.
   */
  setBundleStatus(bundleId: string, status: EBundleStatus): Observable<IBundle> {
    return this.httpService.patch<IBundle>(`bundle/${bundleId}/status`, { status });
  }
  /**
   * Retrieves a single bundle by its unique ID.
   * @param id The ID of the bundle to retrieve.
   * @returns An Observable that emits the requested bundle.
   */
  getBundleById(id: string): Observable<IBundle> {
    return this.httpService.get<IBundle>(`bundle/${id}`);
  }
}
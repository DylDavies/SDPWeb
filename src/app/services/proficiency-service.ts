import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IProficiency } from '../models/interfaces/IProficiency.interface';
import { ISubject } from '../models/interfaces/ISubject.interface';
import { SocketService } from './socket-service';

@Injectable({
  providedIn: 'root'
})
export class ProficiencyService {
  public httpService = inject(HttpService);
  public socketService = inject(SocketService);

  private proficiencies$ = new BehaviorSubject<IProficiency[]>([]);
  public allProficiencies$ = this.proficiencies$.asObservable();

  constructor() {
    // Note: You may want to add a socket listener here to auto-refresh on changes
  }

  /**
   * Fetches all proficiency syllabuses from the API.
   * This is used to populate the initial list for the admin.
   */
  public fetchAllProficiencies(): Observable<IProficiency[]>{
    return this.httpService.get<IProficiency[]>('proficiencies/fetchAll').pipe(
        tap(proficiencies => this.proficiencies$.next(proficiencies))
    );
  }

  /**
   * Adds a new proficiency syllabus or updates an existing one.
   * After a successful POST/PATCH, it refreshes the list of all proficiencies.
   * @param proficiency A partial proficiency object.
   */
  public addOrUpdateProficiency(proficiency: Partial<IProficiency>): Observable<IProficiency> {
    return this.httpService.post<IProficiency>('proficiencies', proficiency).pipe(
      tap(() => this.fetchAllProficiencies().subscribe())
    );
  }

  /**
   * Deletes a proficiency syllabus by its ID.
   * After a successful DELETE, it refreshes the list.
   * @param profId The ID of the proficiency to delete.
   */
  public deleteProficiency(profId: string): Observable<void> {
    return this.httpService.delete<void>(`proficiencies/${profId}`).pipe(
      tap(() => this.fetchAllProficiencies().subscribe())
    );
  }
  
  /**
   * Updates the name of an existing proficiency.
   * After a successful PATCH, it refreshes the list.
   * @param profId The ID of the proficiency to update.
   * @param newName The new name for the proficiency.
   */
  public updateProficiencyName(profId: string, newName: string): Observable<IProficiency> {
    return this.httpService.patch<IProficiency>(`proficiencies/${profId}`, { newName }).pipe(
      tap(() => this.fetchAllProficiencies().subscribe())
    );
  }

  /**
   * Adds or updates a subject within a specific proficiency.
   * After a successful POST, it refreshes the list to show the changes.
   * @param profId The parent proficiency's ID.
   * @param subject The subject object to add or update.
   */
  public addOrUpdateSubject(profId: string, subject: ISubject): Observable<IProficiency> {
    const subjectKey = subject.name.toLowerCase().replace(/\s+/g, '_');
    return this.httpService.post<IProficiency>(`proficiencies/${profId}/subjects/${subjectKey}`, subject).pipe(
      tap(() => this.fetchAllProficiencies().subscribe())
    );
  }

  /**
   * Deletes a subject from a specific proficiency.
   * After a successful DELETE, it refreshes the list.
   * @param profId The parent proficiency's ID.
   * @param subjectKey The key of the subject to delete (e.g., "advanced_mathematics").
   */
  public deleteSubject(profId: string, subjectKey: string): Observable<IProficiency> {
    return this.httpService.delete<IProficiency>(`proficiencies/${profId}/subjects/${subjectKey}`).pipe(
      tap((updatedProficiency) => {
        const currentProficiencies = this.proficiencies$.getValue();
        const index = currentProficiencies.findIndex(p => p._id === profId);
        if (index > -1) {
          currentProficiencies[index] = updatedProficiency;
          this.proficiencies$.next([...currentProficiencies]);
        }
      })
    );
  }
}
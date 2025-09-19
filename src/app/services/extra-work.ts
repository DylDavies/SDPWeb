import { inject, Injectable } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IExtraWork, EExtraWorkStatus } from '../models/interfaces/IExtraWork.interface';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

@Injectable({
  providedIn: 'root'
})
export class ExtraWorkService {
  private httpService = inject(HttpService);
  private socketService = inject(SocketService);

  /**
   * Retrieves all extra work entries from the backend (for admins).
   * @returns An Observable that emits an array of all extra work entries.
   */
  getAllExtraWork(): Observable<IExtraWork[]> {
    return this.httpService.get<IExtraWork[]>('extrawork');
  }

  /**
   * Retrieves extra work entries for the currently logged-in user.
   * @returns An Observable that emits an array of the user's work entries.
   */
  getMyExtraWork(): Observable<IExtraWork[]> {
    return this.httpService.get<IExtraWork[]>('extrawork/mywork');
  }

  /**
   * Creates a new extra work entry.
   * @param payload The data for the new entry.
   * @returns An Observable that emits the newly created entry.
   */
  createExtraWork(payload: Partial<IExtraWork>): Observable<IExtraWork> {
    return this.httpService.post<IExtraWork>('extrawork', payload);
  }
  /**
   * Marks an extra work item as complete.
   * @param workId The ID of the item to update.
   * @param dateCompleted The date it was completed.
   * @returns An Observable of the updated work item.
   */
  completeExtraWork(workId: string, dateCompleted: Date | null): Observable<IExtraWork> {
    return this.httpService.patch<IExtraWork>(`extrawork/${workId}/complete`, { dateCompleted }).pipe(
      tap(() => this.socketService.subscribe(ESocketMessage.ExtraWorkUpdated))
    );
  }

  setExtraWorkStatus(workId: string, status: EExtraWorkStatus): Observable<IExtraWork> {
    return this.httpService.patch<IExtraWork>(`extrawork/${workId}/status`, { status });
  }
}
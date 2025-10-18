import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { IExtraWork, EExtraWorkStatus } from '../models/interfaces/IExtraWork.interface';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { CustomObservableService } from './custom-observable-service';

@Injectable({
  providedIn: 'root'
})
export class ExtraWorkService {
  private httpService = inject(HttpService);
  private socketService = inject(SocketService);
  private observableService = inject(CustomObservableService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private allExtraWorkSubject$ = new BehaviorSubject<IExtraWork[]>([]);
  public allExtraWork$: Observable<IExtraWork[]>;
  private socketListenerSetup = false;

  constructor() {
    this.allExtraWork$ = this.observableService.createManagedTopicObservable(
      ESocketMessage.ExtraWorkUpdated,
      this.allExtraWorkSubject$,
      () => this.getAllExtraWork()
    );

    // Setup socket listener when socket is connected (only in browser)
    if (this.isBrowser) {
      this.setupSocketListener();
    }
  }

  /**
   * Sets up the socket listener for extra work updates.
   * This is called either immediately if socket is connected, or deferred via connection hook.
   */
  private setupSocketListener() {
    if (this.socketListenerSetup) return;

    if (this.socketService.isSocketConnected()) {
      this.socketService.listen(ESocketMessage.ExtraWorkUpdated).subscribe(() => {
        console.log('Received extra-work-updated event. Refreshing user list.');
        this.getAllExtraWork().subscribe();
      });
      this.socketListenerSetup = true;
    } else {
      // Wait for socket to connect before setting up listener
      this.socketService.connectionHook(() => {
        if (!this.socketListenerSetup) {
          this.socketService.listen(ESocketMessage.ExtraWorkUpdated).subscribe(() => {
            console.log('Received extra-work-updated event. Refreshing user list.');
            this.getAllExtraWork().subscribe();
          });
          this.socketListenerSetup = true;
        }
      });
    }
  }

  /**
   * Retrieves all extra work entries from the backend (for admins).
   * @returns An Observable that emits an array of all extra work entries.
   */
  getAllExtraWork(): Observable<IExtraWork[]> {
    return this.httpService.get<IExtraWork[]>('extrawork').pipe(
      tap(allExtraWork => this.allExtraWorkSubject$.next(allExtraWork))
    );
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
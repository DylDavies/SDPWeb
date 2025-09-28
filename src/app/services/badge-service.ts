import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, tap } from 'rxjs';
import { HttpService } from './http-service';
import IBadge from '../models/interfaces/IBadge.interface';
import { IBadgeRequirement } from '../models/interfaces/IBadgeRequirement.interface';
import { SocketService } from './socket-service';
import { CustomObservableService } from './custom-observable-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  private httpService = inject(HttpService);
  private socketService = inject(SocketService);
  private observableService = inject(CustomObservableService);

  private badges$ = new BehaviorSubject<IBadge[]>([]);
  public allBadges$: Observable<IBadge[]>;

  /**
   * Initializes the service, sets up WebSocket listeners, and creates the public observable.
   */
  constructor(){
    this.socketService.listen<unknown>(ESocketMessage.BadgesUpdated).subscribe(() =>{
      console.log('Received badges-updated event. Refreshing badge list.');
      this.getBadges().subscribe();
    });

    this.allBadges$ = this.observableService.createManagedTopicObservable(
      ESocketMessage.BadgesUpdated,
      this.badges$.asObservable(),
      () => this.getBadges()
    );
  }

    /**
   * Fetches the complete list of badges from the API and updates the local state.
   * @returns An Observable that emits an array of badges.
   */
  public getBadges(): Observable<IBadge[]> {
    return this.httpService.get<IBadge[]>('badges').pipe(
      tap(badges => this.badges$.next(badges))
    );
  }

    /**
   * Fetches a specific list of badges from the backend by their IDs.
   * @param ids - An array of badge ID strings.
   * @returns An Observable array of the requested badges.
   */
  getBadgesByIds(ids: string[]): Observable<IBadge[]> {
    if(!ids || ids.length === 0) return of([]);

    return this.httpService.post<IBadge[]>('badges/by-ids', { ids });
  }

    /**
   * Creates a new badge or updates an existing one.
   * After the operation, it triggers a refresh of the local badge list.
   * @param badgeData - The badge data, including optional requirements text.
   * @returns An Observable that emits the created or updated badge.
   */
  addOrUpdateBadge(badgeData: IBadge & { requirements?: string }): Observable<IBadge> {
    return this.httpService.post<IBadge>('badges', badgeData).pipe(
      tap(() => this.getBadges().subscribe())
    );
  }

    /**
   * Deletes a badge from the system.
   * After the operation, it triggers a refresh of the local badge list.
   * @param badgeId - The ID of the badge to delete.
   * @returns An Observable that completes when the deletion is successful.
   */
  deleteBadge(badgeId: string): Observable<void> {
    return this.httpService.delete<void>(`badges/${badgeId}`).pipe(
      tap(() => this.getBadges().subscribe())
    );
  }


    /**
   * Fetches the detailed requirements for a single badge.
   * @param badgeId - The ID of the badge whose requirements are to be fetched.
   * @returns An Observable that emits the badge's requirements.
   */
  getBadgeRequirements(badgeId: string): Observable<IBadgeRequirement> {
    return this.httpService.get<IBadgeRequirement>(`badges/${badgeId}/requirements`);
  }
  
    /**
   * Updates the requirements for a single badge.
   * @param badgeId - The ID of the badge to update.
   * @param requirements - The new requirements text.
   * @returns An Observable that emits the updated badge requirement object.
   */
  updateBadgeRequirements(badgeId: string, requirements: string): Observable<IBadgeRequirement> {
    return this.httpService.patch<IBadgeRequirement>(`badges/${badgeId}/requirements`, { requirements });
  }
}
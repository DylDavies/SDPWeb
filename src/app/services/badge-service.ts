import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import IBadge from '../models/interfaces/IBadge.interface';

@Injectable({
  providedIn: 'root'
})
export class BadgeService {
  // change this to use sockets -- NBBBB
  private httpService = inject(HttpService);

  getBadges(): Observable<IBadge[]> {
    return this.httpService.get<IBadge[]>('badges');
  }

  addOrUpdateBadge(badgeData: IBadge): Observable<IBadge> {
    return this.httpService.post<IBadge>('badges', badgeData);
  }

  deleteBadge(badgeId: string): Observable<void> {
    return this.httpService.delete<void>(`badges/${badgeId}`);
  }

}
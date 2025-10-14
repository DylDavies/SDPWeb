import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  private httpService = inject(HttpService);

  getPlatformStats(): Observable<any> {
    return this.httpService.get<any>('admin/stats/platform');
  }
}

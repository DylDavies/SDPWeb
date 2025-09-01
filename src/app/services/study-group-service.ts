import { inject, Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { IStudyGroup } from '../models/interfaces/IStudyGroup.interface';
import { HttpService } from './http-service';

@Injectable({
  providedIn: 'root'
})
export class StudyGroupService {
  private httpService = inject(HttpService);

  /**
   * Fetches the upcoming scheduled study groups from the backend.
   * @returns An observable with an array of study groups.
   */
  getUpcomingStudyGroups(): Observable<IStudyGroup[]> {
    return this.httpService.get<IStudyGroup[]>('external/consume/studygroups/upcoming');
  }
}

import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { IRemark, IRemarkField, IRemarkTemplate } from '../models/interfaces/IRemark.interface';

@Injectable({
  providedIn: 'root'
})
export class RemarkService {
  private httpService = inject(HttpService);

  getActiveTemplate(): Observable<IRemarkTemplate> {
    return this.httpService.get<IRemarkTemplate>('remarks/templates/active');
  }

  updateTemplate(fields: IRemarkField[]): Observable<IRemarkTemplate> {
    return this.httpService.post<IRemarkTemplate>(`remarks/templates`, { fields });
  }

  createRemark(eventId: string, entries: { field: string, value: string | number | boolean }[]): Observable<IRemark> {
    return this.httpService.post<IRemark>(`remarks/${eventId}`, { entries });
  }

  updateRemark(remarkId: string, entries: { field: string, value: string | number | boolean }[]): Observable<IRemark> {
    return this.httpService.patch<IRemark>(`remarks/${remarkId}`, { entries });
  }

  getRemarkForEvent(eventId: string): Observable<IRemark> {
    return this.httpService.get<IRemark>(`remarks/${eventId}`);
  }

  getRemarksForStudent(studentId: string): Observable<IRemark[]> {
    return this.httpService.get<IRemark[]>(`remarks/student/${studentId}`);
  }
}


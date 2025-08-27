// src/app/services/user.service.ts
import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { IProficiency } from '../models/interfaces/IProficiency.interface';

@Injectable({
  providedIn: 'root'
})

export class ProficiencyService {
  public httpService = inject(HttpService);
  public socketService = inject(SocketService);

  private proficiencies$ = new BehaviorSubject<IProficiency[]>([]);

  /**
   * A public observable that components can subscribe to for the proficiencies list.
   */
  public allProficiencies$ = this.proficiencies$.asObservable();

  public fetchAllProficiencies(): Observable<IProficiency[]>{
    return this.httpService.get<IProficiency[]>('proficiencies/fetchAll').pipe(
        tap(proficiencies => this.proficiencies$.next(proficiencies))
    );
  }

}
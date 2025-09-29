import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { BadgeCardComponent } from '../../../shared/components/badge-card/badge-card';
import { MatChipsModule } from '@angular/material/chips';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { BadgeService } from '../../../services/badge-service';
import { AuthService } from '../../../services/auth-service';
import { combineLatest, map, Observable, startWith } from 'rxjs';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IUserBadge } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-badge-library',
  imports: [CommonModule, BadgeCardComponent, MatChipsModule, ReactiveFormsModule],
  templateUrl: './badge-library.html',
  styleUrl: './badge-library.scss'
})
export class BadgeLibrary{
  private badgeService = inject(BadgeService);
  private authService = inject(AuthService);

  public allBadges$: Observable<IBadge[]>;
  public filteredBadges$: Observable<IBadge[]>;
  public filterCtrl = new FormControl('all');

  constructor() {
    this.allBadges$ = this.badgeService.getBadges();
    
    this.filteredBadges$ = combineLatest([
      this.allBadges$,
      this.authService.currentUser$,
      this.filterCtrl.valueChanges.pipe(startWith('all'))
    ]).pipe(
      map(([allBadges, user, filterValue]) => {
        if (filterValue === 'my') {
          const myBadgeIds = new Set(user?.badges?.map((userBadge: IUserBadge) => userBadge.badge._id));
          return allBadges.filter(b => myBadgeIds.has(b._id));
        }
        return allBadges;
      })
    );
  }

}

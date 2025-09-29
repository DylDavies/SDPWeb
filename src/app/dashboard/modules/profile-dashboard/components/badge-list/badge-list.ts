import { Component, Input, OnDestroy, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IUser, IUserBadge } from '../../../../../models/interfaces/IUser.interface';
import { BadgeCardComponent } from '../../../../../shared/components/badge-card/badge-card';
import { AuthService } from '../../../../../services/auth-service';
import { EPermission } from '../../../../../models/enums/permission.enum';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { AddUserBadgeDialogComponent } from '../../../../../shared/components/add-user-badge-dialog/add-user-badge-dialog';
import { Observable, Subscription, of, filter, ReplaySubject, switchMap, map } from 'rxjs'; 
import { RouterModule } from '@angular/router';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { BadgeService } from '../../../../../services/badge-service'; 

interface BadgeWithUserBadge {
  badge: IBadge;
  userBadge: IUserBadge;
}

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule, BadgeCardComponent, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './badge-list.html',
  styleUrls: ['./badge-list.scss'],
})
export class BadgeListComponent implements OnInit, OnDestroy {
  private userSubject = new ReplaySubject<IUser | null>(1);
  private currentUser: IUser | null = null;

  @Input()
  set user(value: IUser | null) {
    this.currentUser = value; 
    this.userSubject.next(value);
  }
  get user(): IUser | null {
    return this.currentUser;
  }

  @Output() userUpdated = new EventEmitter<void>();

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackBarService);
  private badgeService = inject(BadgeService); 

  public canManageBadges = false;
  public combinedBadges$: Observable<BadgeWithUserBadge[]> = of([]);
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.canManageBadges = this.authService.hasPermission(EPermission.BADGES_MANAGE);

    this.combinedBadges$ = this.userSubject.pipe(
      switchMap(user => {
        if (!user || !user.badges || user.badges.length === 0) {
          return of([]); // No badges
        }
        
        // map for lookup of a users badge data
        const userBadgesMap = new Map<string, IUserBadge>();
        user.badges.forEach(ub => {
          const badgeId = typeof ub.badge === 'string' ? ub.badge : ub.badge._id;
          if (badgeId) {
            userBadgesMap.set(badgeId, ub);
          }
        });

        if (userBadgesMap.size === 0) {
          return of([]);
        }

        //  subscribe to the real time stream of all badges from the service.
        return this.badgeService.allBadges$.pipe(
          map(allBadges => 
            allBadges
              .filter(badge => userBadgesMap.has(badge._id))
              .map(badge => ({
                badge: badge,
                userBadge: userBadgesMap.get(badge._id)!
              }))
          )
        );
      })
    );
  }

  ngOnDestroy(): void {
    if(this.userSubscription) this.userSubscription.unsubscribe();
  }

  openAddBadgeDialog(): void {
    const dialogRef = this.dialog.open(AddUserBadgeDialogComponent, {
      width: '400px',
      data: { user: this.currentUser },
    });

    dialogRef.afterClosed().pipe(filter(result => !!result)).subscribe((result) => {
      if (result.updatedUser){
        this.snackbarService.showSuccess('Badge added to user.');
        this.userUpdated.emit(); //refresh
      } 
      else if(result.error){
        this.snackbarService.showError('An error occurred, but the badge may have been added.');
      }
    });
  }
}
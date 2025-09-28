import { Component, Input, OnDestroy, OnInit, inject, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
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
import { Observable, Subscription, of, filter } from 'rxjs'; 
import { RouterModule } from '@angular/router';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { BadgeService } from '../../../../../services/badge-service'; 

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule, BadgeCardComponent, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './badge-list.html',
  styleUrls: ['./badge-list.scss'],
})
export class BadgeListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() user: IUser | null = null;
  @Output() userUpdated = new EventEmitter<void>();

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackBarService);
  private badgeService = inject(BadgeService); 

  public canManageBadges = false;
  public badges$: Observable<IBadge[]> = of([]); 
  
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.canManageBadges = this.authService.hasPermission(EPermission.BADGES_MANAGE);
  }
  
ngOnChanges(changes: SimpleChanges): void {
  if (changes['user'] && this.user && this.user.badges) {
    const userBadges = this.user.badges;

    if (userBadges.length > 0) {
      const badgeIds = userBadges.map((userBadge: IUserBadge) => {
        return typeof userBadge.badge === 'string' ? userBadge.badge : userBadge.badge._id;
      }).filter(id => !!id); // Filter out any null/undefined values
      
      if (badgeIds.length > 0) {
        this.badges$ = this.badgeService.getBadgesByIds(badgeIds);
      } else {
        this.badges$ = of([]);
      }
    } 
    else {
      this.badges$ = of([]);
    }
  }
}

  ngOnDestroy(): void {
    if(this.userSubscription) this.userSubscription.unsubscribe();
  }

  openAddBadgeDialog(): void {
    const dialogRef = this.dialog.open(AddUserBadgeDialogComponent, {
      width: '400px',
      data: { user: this.user },
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
import { Component, Input, OnDestroy, OnInit, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { BadgeCardComponent } from '../../../../../shared/components/badge-card/badge-card';
import { AuthService } from '../../../../../services/auth-service';
import { EPermission } from '../../../../../models/enums/permission.enum';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { AddUserBadgeDialogComponent } from '../../../../../shared/components/add-user-badge-dialog/add-user-badge-dialog';
import { Subscription } from 'rxjs';
import { RouterModule } from '@angular/router';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-badge-list',
  standalone: true,
  imports: [CommonModule, BadgeCardComponent, MatButtonModule, MatIconModule, RouterModule],
  templateUrl: './badge-list.html',
  styleUrls: ['./badge-list.scss'],
})
export class BadgeListComponent implements OnInit, OnDestroy {
  @Input() user: IUser | null = null;
  @Output() userUpdated = new EventEmitter<void>();

  private authService = inject(AuthService);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackBarService);

  public canManageBadges = false;
  public badges: IBadge[] = [];
  
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.canManageBadges = this.authService.hasPermission(EPermission.BADGES_MANAGE);
    
    // Update badge list when a change occurs
    this.userSubscription = this.authService.currentUser$.subscribe((currentUser) => {
        if (currentUser && currentUser._id === this.user?._id) {
            this.user = currentUser; // Update the whole user object
            this.badges = this.user.badges || [];
        }
    });
    
    this.badges = this.user?.badges || [];
  }

  ngOnDestroy(): void {
    if(this.userSubscription) this.userSubscription.unsubscribe();
  }


  openAddBadgeDialog(): void {
    const dialogRef = this.dialog.open(AddUserBadgeDialogComponent, {
      width: '400px',
      data: { user: this.user },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.updatedUser){
        this.snackbarService.showSuccess('Badge added to user.');
        this.authService.updateCurrentUserState(result.updatedUser);  // update the auth state with the fresh user object
      } 
      else if(result && result.error){
        this.snackbarService.showError('An error occurred, but the badge may have been added.');
      }
    });
  }
}
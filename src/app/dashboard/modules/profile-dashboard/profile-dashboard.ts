import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserTypePipe } from '../../../pipes/usertype-pipe';
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';
import { RoleChipRow } from '../../components/role-chip-row/role-chip-row';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { EditProfileComponent } from '../../../shared/components/edit-profile-component/edit-profile-component';
import { LeaveModal } from "./components/leave-modal/leave-modal";
import { ProficiencyManagement } from './components/proficiency-management/proficiency-management';
import {MatTabsModule} from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { LeaveManagement } from './components/leave-management/leave-management';
import { EditAvailabilityDialog } from './components/edit-availability-dialog/edit-availability-dialog';
import { filter, switchMap, map, of, Subscription } from 'rxjs';
import { SnackBarService } from '../../../services/snackbar-service';
import { MatTooltip } from '@angular/material/tooltip';
import { BadgeListComponent } from './components/badge-list/badge-list';
import { StatsComponent } from './components/stats/stats';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, UserTypePipe, DatePipe, DisplayNamePipe,
    RoleChipRow, MatDialogModule,MatTabsModule,LeaveManagement, ProficiencyManagement, MatTooltip, BadgeListComponent, StatsComponent
  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss'
})
export class Profile implements OnInit, OnDestroy {
  public authService = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  public dialog = inject(MatDialog);
  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);

  public user: IUser | null = null;
  public isLoading = true;
  public isOwnProfile = false;
  public userNotFound = false;
  private userSubscription?: Subscription;

  ngOnInit(): void {
    this.loadUser();
  }

  ngOnDestroy(): void {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadUser(): void {
    this.isLoading = true;
    const userIdFromRoute = this.route.snapshot.paramMap.get('id');

    // Create a reactive stream that automatically updates when the user changes
    this.userSubscription = this.authService.currentUser$.pipe(
      switchMap(currentUser => {
        const idToFetch = userIdFromRoute || currentUser?._id;
        
        if (idToFetch) {
          this.isOwnProfile = !userIdFromRoute || userIdFromRoute === currentUser?._id;
          if (!this.isOwnProfile) this.userService.getUserById(idToFetch);
          else {
            this.user = currentUser;
            this.userNotFound = false;
            this.isLoading = false;
          }
        } else {
          // This handles the case where there is no route ID and the currentUser$ is initially null
          this.isLoading = false;
          this.userNotFound = !currentUser;
          this.user = currentUser;
          this.isLoading = false;
          return of(null);
        }

        // Return the reactive user stream from the service
        return this.userService.getUserById(idToFetch).pipe(
          map(user => {
            if (user) {
              this.userNotFound = false;
              return user;
            } else {
              this.userNotFound = true;
              return null;
            }
          })
        );
      })
    ).subscribe({
      next: (user) => {
        this.user = user;
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.userNotFound = true;
      }
    });
  }

  refreshUserData(): void {
    this.userService.fetchAllUsers().subscribe();
  }

  openLeaveModal(): void {
    if (this.user) {
      this.dialog.open(LeaveModal, {
        width: 'clamp(60vh, 80vw, 60vh)', 
        data: this.user
      });
    }
  }

  editProfile(): void {
    if (!this.user) return;

    const dialogRef = this.dialog.open(EditProfileComponent, {
      width: 'clamp(300px, 90vw, 500px)',
      data: this.user
    });

    dialogRef.afterClosed().subscribe(updatedUser => {
      if (updatedUser) {
        if (this.isOwnProfile) {
          this.authService.updateCurrentUserState(updatedUser);
        }
        this.refreshUserData();
      }
    });
  }

  openEditAvailabilityDialog(): void {
    if (!this.user) return;

    const dialogRef = this.dialog.open(EditAvailabilityDialog, {
      width: 'clamp(300px, 90vw, 400px)',
      data: { availability: this.user.availability || 0 }
    });

    dialogRef.afterClosed().pipe(filter(result => typeof result === 'number')).subscribe((newAvailability: number) => {
      this.userService.updateUserAvailability(this.user!._id, newAvailability).subscribe({
        next: (updatedUser) => {
          this.snackbarService.showSuccess('Availability updated successfully!'); 
          this.user = updatedUser;
          if (this.isOwnProfile) {
            this.authService.updateCurrentUserState(updatedUser);
          }
        },
        error: () => {
          this.snackbarService.showError('Failed to update availability.');
        }
      });
    });
  }

  redirectToDashboard() {
    this.router.navigateByUrl("/dashboard");
  }
}

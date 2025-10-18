import { Component, inject, OnInit } from '@angular/core';
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
import { EditAddressDialog } from './components/edit-address-dialog/edit-address-dialog';
import { LeaveModal } from "./components/leave-modal/leave-modal";
import { ProficiencyManagement } from './components/proficiency-management/proficiency-management';
import {MatTabsModule} from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { LeaveManagement } from './components/leave-management/leave-management';
import { EditAvailabilityDialog } from './components/edit-availability-dialog/edit-availability-dialog';
import { filter } from 'rxjs';
import { SnackBarService } from '../../../services/snackbar-service'; 
import { MatTooltip } from '@angular/material/tooltip';
import { BadgeListComponent } from './components/badge-list/badge-list';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, UserTypePipe, DatePipe, DisplayNamePipe,
    RoleChipRow, MatDialogModule,MatTabsModule,LeaveManagement, ProficiencyManagement, MatTooltip, BadgeListComponent
  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss'
})
export class Profile implements OnInit {
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

  ngOnInit(): void {
    this.loadUser();
  }
  
  loadUser(): void {
    this.isLoading = true;
    const userIdFromRoute = this.route.snapshot.paramMap.get('id');

    this.authService.currentUser$.subscribe({
      next: (currentUser) => {
        const idToFetch = userIdFromRoute || currentUser?._id;
        
        if (idToFetch) {
          this.isOwnProfile = !userIdFromRoute || userIdFromRoute === currentUser?._id;
          this.fetchUserById(idToFetch);
        } else {
          // This handles the case where there is no route ID and the currentUser$ is initially null
          this.isLoading = false;
          this.userNotFound = !currentUser;
          this.user = currentUser;
        }
      }
    });
  }

  private fetchUserById(id: string): void {
    this.userService.getUserById(id).subscribe({
      next: (user) => {
        if (user) {
          this.user = user;
          this.userNotFound = false;
        } else {
          this.userNotFound = true;
        }
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

  openEditAddressDialog(): void {
    if (!this.user) return;

    const dialogRef = this.dialog.open(EditAddressDialog, {
      width: 'clamp(400px, 90vw, 600px)',
      data: this.user
    });

    dialogRef.afterClosed().subscribe(updatedUser => {
      if (updatedUser) {
        this.user = updatedUser;
        if (this.isOwnProfile) {
          this.authService.updateCurrentUserState(updatedUser);
        }
        this.refreshUserData();
      }
    });
  }

  redirectToDashboard() {
    this.router.navigateByUrl("/dashboard");
  }
}

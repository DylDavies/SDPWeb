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
import { LeaveModal } from "./components/leave-modal/leave-modal";
import { ProficiencyManagement } from './components/proficiency-management/proficiency-management';
import {MatTabsModule} from '@angular/material/tabs';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '../../../services/user-service';
import { LeaveManagement } from './components/leave-management/leave-management';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, UserTypePipe, DatePipe, DisplayNamePipe,
    RoleChipRow, MatDialogModule,MatTabsModule,LeaveManagement, ProficiencyManagement
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

  public user: IUser | null = null;
  public isLoading = true;
  public isOwnProfile = false; // To control UI elements
  public userNotFound = false;

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('id');

    this.authService.currentUser$.subscribe({
      next: (currentUser) => {
        if (userId) {
          this.isOwnProfile = currentUser?._id == userId;
          this.userService.getUserById(userId).subscribe({
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
        } else {
          this.isOwnProfile = true;
          this.user = currentUser;
          this.isLoading = false;
        }
      }
    });
  }

  openLeaveModal(): void {
    if (this.user) {
      this.dialog.open(LeaveModal, {
        width: 'clamp(60vh, 80vw, 60vh)', 
        data: this.user._id
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
        this.authService.updateCurrentUserState(updatedUser);
      }
    });
  }

  redirectToDashboard() {
    this.router.navigateByUrl("/dashboard");
  }
}
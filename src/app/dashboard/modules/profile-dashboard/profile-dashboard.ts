import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // <-- Import DatePipe
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

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, UserTypePipe, DatePipe, DisplayNamePipe,
    RoleChipRow, MatDialogModule
  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss'
})
export class Profile implements OnInit {
  public authService = inject(AuthService);
  public user: IUser | null = null;
  public dialog = inject(MatDialog); 


  openLeaveModal(): void {
    this.dialog.open(LeaveModal, {
      width: 'clamp(60vh, 80vw, 60vh)', // Responsive width
    });
  }


  
  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        console.log(user);
      }
    });
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
}
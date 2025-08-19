import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // <-- Import DatePipe
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserRolePipe } from '../../../pipes/userrole-pipe';
import { MatDialog } from '@angular/material/dialog';
import { EditProfileComponent } from '../../../shared/components/edit-profile-component/edit-profile-component';
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';

@Component({
  selector: 'app-profile-dashboard',
  standalone: true,
  imports: [
    CommonModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, UserRolePipe, DatePipe, DisplayNamePipe
  ],
  templateUrl: './profile-dashboard.html',
  styleUrl: './profile-dashboard.scss'
})
export class Profile implements OnInit {
  public authService = inject(AuthService);
  public user: IUser | null = null;
  public dialog = inject(MatDialog); 

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
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
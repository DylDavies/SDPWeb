import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input'
import { UserService } from '../../../services/user-service';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-profile-update-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './profile-update-modal.html',
  styleUrl: './profile-update-modal.scss'
})
export class ProfileUpdateModal {
private fb = inject(FormBuilder);
  private userService = inject(UserService);
  public dialogRef = inject(MatDialogRef<ProfileUpdateModal>);

  public isSaving = false;

  profileForm = this.fb.group({
    displayName: ['', Validators.required]
  });

  onSubmit(): void {
    if (this.profileForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const newDisplayName = this.profileForm.value.displayName!;
    
    this.userService.updateProfile({ displayName: newDisplayName }).subscribe({
      next: (updatedUserWithFlag) => {
        const updatedUser: IUser = {
          ...updatedUserWithFlag,
          firstLogin: false
        };
        this.dialogRef.close(updatedUser);
      },
      error: (err) => {
        console.error('Failed to update profile', err);
        this.isSaving = false;
      }
    });
  }
}

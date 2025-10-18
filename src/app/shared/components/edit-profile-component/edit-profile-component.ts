import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { SnackBarService } from '../../../services/snackbar-service';

@Component({
  selector: 'app-edit-profile-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatProgressSpinnerModule
  ],
  templateUrl: './edit-profile-component.html',
  styleUrls: ['./edit-profile-component.scss'],
})
export class EditProfileComponent {
  editForm: FormGroup;
  isSaving = false;

  public dialogRef = inject(MatDialogRef<EditProfileComponent>);
  public data: IUser = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);

  constructor() {
    this.editForm = this.fb.group({
      displayName: [this.data.displayName, Validators.required]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const updatedData = { displayName: this.editForm.value.displayName! };

    this.userService.updateProfile(updatedData).subscribe({
      next: (updatedUser) => {
        this.snackbarService.showSuccess('Profile updated successfully!');
        this.dialogRef.close(updatedUser);
      },
      error: (err) => {
        this.snackbarService.showError('Failed to update profile.');
        console.error(err);
        this.isSaving = false;
      }
    });
  }
}
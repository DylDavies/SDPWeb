import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { NotificationService } from '../../../../../services/notification-service';

@Component({
  selector: 'app-edit-availability-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './edit-availability-dialog.html',
  styleUrl: './edit-availability-dialog.scss',
})
export class EditAvailabilityDialog {
  form: FormGroup;
  
  public dialogRef = inject(MatDialogRef<EditAvailabilityDialog>);
  public data: { availability: number } = inject(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private notificationService = inject(NotificationService);

  constructor() {
    this.form = this.fb.group({
      availability: [this.data.availability, [Validators.required, Validators.min(0), Validators.max(56)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }

    const value = this.form.value.availability;
    if(value > 168){
      const random =  Math.floor(Math.random() * 10000) + 1; // Tune user
      if(random == 1){
        this.notificationService.showError("Are you a fucking dumbass???? There are only 168 hours in a week.");
      }
      else{
        this.notificationService.showError("There are only 168 hours in a week.");
      }

      return;
    }

    this.dialogRef.close(this.form.value.availability);
  }
}
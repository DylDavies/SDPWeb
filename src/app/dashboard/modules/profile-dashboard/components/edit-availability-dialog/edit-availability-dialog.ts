import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

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

  constructor() {
    this.form = this.fb.group({
      availability: [this.data.availability, [Validators.required, Validators.min(0)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }
    this.dialogRef.close(this.form.value.availability);
  }
}
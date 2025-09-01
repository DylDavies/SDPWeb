import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { TimeSpinner } from '../../../../../shared/components/time-spinner/time-spinner';

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TimeSpinner
  ],
  templateUrl: './add-event-modal.html',
  styleUrls: ['./add-event-modal.scss']
})
export class AddEventModal {
  private fb = inject(FormBuilder);
  public dialogRef = inject(MatDialogRef<AddEventModal>);
  public data: { date: Date } = inject(MAT_DIALOG_DATA);

  public eventForm: FormGroup;

  constructor() {
    this.eventForm = this.fb.group({
      name: ['', Validators.required],
      startTime: ['09:00', Validators.required],
      duration: [15, [Validators.required, Validators.min(15)]]
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.eventForm.valid) {
      this.dialogRef.close(this.eventForm.value);
    }
  }
}
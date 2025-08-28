import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { BundleService } from '../../../../../services/bundle-service';
import { NotificationService } from '../../../../../services/notification-service';

@Component({
  selector: 'app-create-bundle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './create-bundle-modal.html',
  styleUrls: ['./create-bundle-modal.scss']
})
export class CreateBundleModal {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<CreateBundleModal>);

  public createBundleForm: FormGroup;
  public isSaving = false;

  constructor() {
    this.createBundleForm = this.fb.group({
      student: ['', Validators.required],
      subjects: this.fb.array([])
    });
    this.addSubject(); // Start with one subject row
  }

  get subjects(): FormArray {
    return this.createBundleForm.get('subjects') as FormArray;
  }

  createSubjectGroup(): FormGroup {
    return this.fb.group({
      subject: ['', Validators.required],
      tutor: ['', Validators.required],
      hours: [1, [Validators.required, Validators.min(1)]]
    });
  }

  addSubject(): void {
    this.subjects.push(this.createSubjectGroup());
  }

  removeSubject(index: number): void {
    this.subjects.removeAt(index);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.createBundleForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    const { student, subjects } = this.createBundleForm.value;

    this.bundleService.createBundle(student, subjects).subscribe({
      next: (newBundle) => {
        this.notificationService.showSuccess('Bundle created successfully!');
        this.dialogRef.close(newBundle);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to create bundle.');
      }
    });
  }
}
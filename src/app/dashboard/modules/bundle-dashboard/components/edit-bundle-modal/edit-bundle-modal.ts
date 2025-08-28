import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { IBundle, IBundleSubject } from '../../../../../models/interfaces/IBundle.interface';
import { BundleService } from '../../../../../services/bundle-service';
import { NotificationService } from '../../../../../services/notification-service';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

@Component({
  selector: 'app-edit-bundle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatInputModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './edit-bundle-modal.html',
  styleUrls: ['./edit-bundle-modal.scss']
})
export class EditBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<EditBundleModal>);
  public data: IBundle = inject(MAT_DIALOG_DATA);

  public editForm: FormGroup;
  public isSaving = false;

  constructor() {
    this.editForm = this.fb.group({
      isActive: [this.data.isActive, Validators.required],
      subjects: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.data.subjects.forEach(subject => {
      this.subjects.push(this.createSubjectGroup(subject));
    });
  }

  get subjects(): FormArray {
    return this.editForm.get('subjects') as FormArray;
  }

  getStudentName(): string {
    if (typeof this.data.student === 'object' && this.data.student.displayName) {
      return this.data.student.displayName;
    }
    return 'a Student';
  }

  createSubjectGroup(subject?: IBundleSubject): FormGroup {
    const tutorId = typeof subject?.tutor === 'object' ? subject.tutor._id : subject?.tutor;

    return this.fb.group({
      _id: [subject?._id],
      subject: [subject?.subject || '', Validators.required],
      tutor: [tutorId || '', Validators.required],
      hours: [subject?.hours || 1, [Validators.required, Validators.min(1)]]
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

  onSave(): void {
    if (this.editForm.invalid || this.isSaving) {
      return;
    }

    this.isSaving = true;
    
    // Get the form values and add the 'pending' status
    const updateData = {
      ...this.editForm.value,
      status: EBundleStatus.Pending
    };

    this.bundleService.updateBundle(this.data._id, updateData).subscribe({
      next: (updatedBundle) => {
        this.notificationService.showSuccess('Bundle updated and set to pending for review.');
        this.dialogRef.close(updatedBundle);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to update bundle.');
      }
    });
  }
}
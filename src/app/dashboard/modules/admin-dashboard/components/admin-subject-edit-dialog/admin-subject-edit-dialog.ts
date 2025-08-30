import { Component, Inject, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { LiveAnnouncer } from '@angular/cdk/a11y';

import { ISubject } from '../../../../../models/interfaces/ISubject.interface';

@Component({
  selector: 'app-admin-subject-edit-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatChipsModule,
    MatIconModule
  ],
  templateUrl: './admin-subject-edit-dialog.html',
  styleUrls: ['./admin-subject-edit-dialog.scss']
})
export class AdminSubjectEditDialog {
  form: FormGroup;
  isEditMode: boolean;
  grades: string[] = [];
  announcer = inject(LiveAnnouncer);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AdminSubjectEditDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { subject?: ISubject }
  ) {
    this.isEditMode = !!data.subject;
    this.grades = data.subject?.grades ? [...data.subject.grades] : [];

    this.form = this.fb.group({
      name: [data.subject?.name || '', Validators.required],
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.form.valid) {
      this.dialogRef.close({
        ...this.form.value,
        grades: this.grades,
        _id: this.data.subject?._id
      });
    }
  }

  removeGrade(grade: string): void {
    const index = this.grades.indexOf(grade);
    if (index >= 0) {
      this.grades.splice(index, 1);
      this.announcer.announce(`Removed ${grade}`);
    }
  }

  addGrade(event: MatChipInputEvent): void {
    const value = (event.value || '').trim();
    if (value) {
      this.grades.push(value);
    }
    event.chipInput!.clear();
  }
}
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RemarkService } from '../../../../../services/remark-service';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IRemark, IRemarkTemplate } from '../../../../../models/interfaces/IRemark.interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TimeSpinner } from '../../../../../shared/components/time-spinner/time-spinner';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-add-remark-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSlideToggleModule,
    TimeSpinner
  ],
  templateUrl: './add-remark-modal.html',
  styleUrls: ['./add-remark-modal.scss']
})
export class AddRemarkModal implements OnInit {
  private fb = inject(FormBuilder);
  private remarkService = inject(RemarkService);
  private snackBarService = inject(SnackBarService);
  public dialogRef = inject(MatDialogRef<AddRemarkModal>);
  public data: { event: IEvent, remark?: IRemark } = inject(MAT_DIALOG_DATA);

  public remarkForm: FormGroup;
  public template: IRemarkTemplate | null = null;
  public isSaving = false;
  public isLoading = true;
  public isEditMode = false;

  constructor() {
    this.remarkForm = this.fb.group({});
    this.isEditMode = !!this.data.remark;
  }

  ngOnInit(): void {
    if (this.isEditMode && this.data.remark) {
        this.initializeFormWithTemplate(this.data.remark.template);
    } else {
        this.remarkService.getActiveTemplate().subscribe(template => {
            this.initializeFormWithTemplate(template);
        });
    }
  }

  private initializeFormWithTemplate(template: IRemarkTemplate | null): void {
    if (template) {
        this.template = template;
        this.template.fields.forEach(field => {
            const existingEntry = this.data.remark?.entries.find(e => e.field === field.name);
            let defaultValue: string | number | boolean = '';

            if (!this.isEditMode) {
                switch (field.type) {
                    case 'boolean': {
                        defaultValue = false;
                        break;
                    }
                    case 'number': {
                        defaultValue = 0;
                        break;
                    }
                    case 'time': {
                        const eventDate = new Date(this.data.event.startTime);
                        const hours = eventDate.getHours().toString().padStart(2, '0');
                        const minutes = eventDate.getMinutes().toString().padStart(2, '0');
                        defaultValue = `${hours}:${minutes}`;
                        break;
                    }
                }
            }
            this.remarkForm.addControl(field.name, this.fb.control(existingEntry?.value ?? defaultValue, Validators.required));
        });
    }
    this.isLoading = false;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.remarkForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;

    const entries = Object.keys(this.remarkForm.value).map(field => ({
      field,
      value: this.remarkForm.value[field]
    }));

    const apiCall = this.isEditMode
        ? this.remarkService.updateRemark(this.data.remark!._id, entries)
        : this.remarkService.createRemark(this.data.event._id, entries);

    apiCall.subscribe({
      next: () => {
        this.snackBarService.showSuccess('Remark saved successfully!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        this.snackBarService.showError(err.error?.message || 'Failed to save remark.');
        this.isSaving = false;
      }
    });
  }
}
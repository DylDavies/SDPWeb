import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RemarkService } from '../../../../../services/remark-service';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IRemark, IRemarkTemplate } from '../../../../../models/interfaces/IRemark.interface';
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { TimeSpinner } from '../../../../../shared/components/time-spinner/time-spinner';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { FileService } from '../../../../../services/file-service';
import { FileUploadComponent } from '../../../../../shared/components/file-upload-component/file-upload-component';
import { switchMap, of, Observable } from 'rxjs';
import { forkJoin } from 'rxjs';
import { TextFieldModule } from '@angular/cdk/text-field';

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
    MatIconModule,
    TimeSpinner,
    FileUploadComponent,
    TextFieldModule
  ],
  templateUrl: './add-remark-modal.html',
  styleUrls: ['./add-remark-modal.scss']
})
export class AddRemarkModal implements OnInit {
  private fb = inject(FormBuilder);
  private remarkService = inject(RemarkService);
  private snackBarService = inject(SnackBarService);
  private fileService = inject(FileService);
  public dialogRef = inject(MatDialogRef<AddRemarkModal>);
  public data: { event: IEvent, remark?: IRemark } = inject(MAT_DIALOG_DATA);

  public remarkForm: FormGroup;
  public template: IRemarkTemplate | null = null;
  public isSaving = false;
  public isLoading = true;
  public isEditMode = false;
  public fileFieldsMap = new Map<string, File>();
  public existingDocumentsMap = new Map<string, IDocument>();
  public filesReadyForUpload = false; // Track file upload readiness for change detection

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
            let defaultValue: string | number | boolean | null = '';
            const isFileField = ['pdf', 'image', 'audio'].includes(field.type);

            if (isFileField) {
                // For file fields, store existing document if in edit mode
                if (this.isEditMode && existingEntry?.value && typeof existingEntry.value === 'object') {
                    this.existingDocumentsMap.set(field.name, existingEntry.value as IDocument);
                    defaultValue = null;
                } else {
                    defaultValue = null;
                }
                this.remarkForm.addControl(field.name, this.fb.control(defaultValue));
            } else {
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
                const validators = isFileField ? [] : [Validators.required];
                this.remarkForm.addControl(field.name, this.fb.control(existingEntry?.value ?? defaultValue, validators));
            }
        });
    }
    this.isLoading = false;
    // Initialize file readiness check
    this.updateFilesReadiness();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onFileSelected(fieldName: string, file: File): void {
    this.fileFieldsMap.set(fieldName, file);
    this.remarkForm.patchValue({ [fieldName]: file });
    // Update file readiness flag to trigger change detection
    this.updateFilesReadiness();
  }

  private updateFilesReadiness(): void {
    this.filesReadyForUpload = this.areRequiredFilesUploaded();
    this.remarkForm.updateValueAndValidity();
  }

  getFileTypeForField(fieldType: string): string[] {
    switch (fieldType) {
      case 'pdf':
        return ['application/pdf'];
      case 'image':
        return ['image/*'];
      case 'audio':
        return ['audio/*'];
      default:
        return [];
    }
  }

  hasFileFields(): boolean {
    if (!this.template?.fields) return false;
    return this.template.fields.some(f => ['pdf', 'image', 'audio'].includes(f.type));
  }

  isFileFieldType(fieldType: string): boolean {
    return ['pdf', 'image', 'audio'].includes(fieldType);
  }

  areRequiredFilesUploaded(): boolean {
    if (!this.template?.fields) return true;

    const fileFields = this.template.fields.filter(f => this.isFileFieldType(f.type));

    for (const field of fileFields) {
      const hasNewFile = this.fileFieldsMap.has(field.name);
      const hasExistingFile = this.existingDocumentsMap.has(field.name);

      if (!hasNewFile && !hasExistingFile) {
        return false;
      }
    }

    return true;
  }

  canSave(): boolean {
    return !this.remarkForm.invalid && !this.isSaving && this.areRequiredFilesUploaded();
  }

  onSave(): void {
    if (!this.canSave()) {
      return;
    }
    this.isSaving = true;

    // Upload files first if any
    const fileUploadObservables: Observable<IDocument>[] = [];
    const fileFieldNames: string[] = [];

    this.fileFieldsMap.forEach((file, fieldName) => {
      fileFieldNames.push(fieldName);
      fileUploadObservables.push(
        this.fileService.getPresignedUploadUrl(file.name, file.type).pipe(
          switchMap(uploadData =>
            this.fileService.uploadFileToSignedUrl(uploadData.url, file).pipe(
              switchMap(() => this.fileService.finalizeUpload(uploadData.fileKey, file.name, file.type))
            )
          )
        )
      );
    });

    // If no files to upload, use of([]) to get an empty array
    const uploadObservable: Observable<IDocument[]> = fileUploadObservables.length > 0
      ? forkJoin(fileUploadObservables)
      : of([]);

    uploadObservable.pipe(
      switchMap((uploadedDocuments) => {
        const allEntries = Object.keys(this.remarkForm.value).map(field => {
          const fieldIndex = fileFieldNames.indexOf(field);
          let value: string | number | boolean | null;

          if (fieldIndex !== -1) {
            // This is a file field that was uploaded
            // Ensure _id is explicitly converted to string
            value = String(uploadedDocuments[fieldIndex]._id);
          } else {
            const fieldDef = this.template?.fields.find(f => f.name === field);
            const isFileField = fieldDef && ['pdf', 'image', 'audio'].includes(fieldDef.type);
            if (isFileField) {
              // This is a file field but no new file was uploaded, use existing document if available
              const existingDoc = this.existingDocumentsMap.get(field);
              // Ensure _id is explicitly converted to string
              value = existingDoc ? String(existingDoc._id) : null;
            } else {
              value = this.remarkForm.value[field];
            }
          }

          return {
            field,
            value
          };
        });

        // Filter out null values and type-cast the result
        const entries: { field: string; value: string | number | boolean }[] = allEntries
          .filter((entry): entry is { field: string; value: string | number | boolean } => entry.value !== null);

        const apiCall = this.isEditMode
          ? this.remarkService.updateRemark(this.data.remark!._id, entries)
          : this.remarkService.createRemark(this.data.event._id, entries);

        return apiCall;
      })
    ).subscribe({
      next: () => {
        this.snackBarService.showSuccess('Remark saved successfully!');
        this.dialogRef.close(true);
      },
      error: (err: unknown) => {
        const errorMessage = err && typeof err === 'object' && 'error' in err &&
                           err.error && typeof err.error === 'object' && 'message' in err.error
                           ? String(err.error.message)
                           : 'Failed to save remark.';
        this.snackBarService.showError(errorMessage);
        this.isSaving = false;
      }
    });
  }
}
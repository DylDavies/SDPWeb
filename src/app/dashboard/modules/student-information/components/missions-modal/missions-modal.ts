import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MissionService } from '../../../../../services/missions-service';
import { BundleService } from '../../../../../services/bundle-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { map, switchMap } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../../../services/auth-service';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { FileService } from '../../../../../services/file-service';
import { FileUploadComponent } from "../../../../../shared/components/file-upload-component/file-upload-component";

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const selectedDate = control.value as Date;
    if (!selectedDate) {
      return null;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return selectedDate < today ? { pastDate: true } : null;
  };
}

@Component({
  selector: 'app-missions-modal',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule,
    MatSelectModule, MatDatepickerModule, FileUploadComponent
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './missions-modal.html',
  styleUrls: ['./missions-modal.scss']
})
export class MissionsModal implements OnInit {

  private fb = inject(FormBuilder);
  private missionService = inject(MissionService);
  private bundleService = inject(BundleService);
  private snackBarService = inject(SnackBarService);
  private authService = inject(AuthService);
  private fileService = inject(FileService);
  public dialogRef = inject(MatDialogRef<MissionsModal>);
  public data: { student: IUser | IPopulatedUser, mission?: IMissions, bundleId: string } = inject(MAT_DIALOG_DATA);

  public EMissionStatus = EMissionStatus;

  public createMissionForm: FormGroup;
  public isSaving = false;
  public isEditMode = false;
  public tutors$: Observable<IPopulatedUser[]> = of([]);
  public selectedFile: File | null = null;
  private currentUser: IUser | null = null;
  public missionStatuses = Object.values(EMissionStatus);
  public minDate: Date;

  constructor() {
    this.minDate = new Date();
    this.createMissionForm = this.fb.group({
      studentName: [{ value: '', disabled: true }, Validators.required],
      tutorId: ['', Validators.required],
      dateCompleted: ['', [Validators.required, futureDateValidator()]],
      remuneration: ['', [Validators.required, Validators.min(0)]],
      status: [{value: this.data.mission?.status || EMissionStatus.Active, disabled: this.data.mission?.status == EMissionStatus.Achieved}, Validators.required],
      document: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    this.isEditMode = !!this.data.mission;
    if (this.isEditMode) {
      this.missionStatuses = Object.values(EMissionStatus).filter(
        status => status !== EMissionStatus.Active && status !== EMissionStatus.InActive
      );
    }
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });


    if (this.data.student) {
      this.createMissionForm.get('studentName')?.setValue(this.data.student.displayName);
      this.fetchTutorsForStudent(this.data.bundleId);
    }
    if (this.isEditMode && this.data.mission) {
      const tutor = this.data.mission.tutor;
      const tutorId = typeof tutor === 'object' ? tutor._id : tutor;

      this.createMissionForm.patchValue({
        tutorId: tutorId,
        dateCompleted: this.data.mission.dateCompleted,
        remuneration: this.data.mission.remuneration,
        status: this.data.mission.status,
        document: this.data.mission.document
      });
      this.createMissionForm.get('document')?.clearValidators();
    } else {
      this.createMissionForm.get('document')?.setValidators(Validators.required);
    }
  }

  private fetchTutorsForStudent(bundleId: string): void {
    this.tutors$ = this.bundleService.getBundleById(bundleId).pipe(
      map(bundle => {
        if (!bundle) {
            return [];
        }
        const tutors = new Map<string, IPopulatedUser>();
        bundle.subjects.forEach(subject => {
          if (typeof subject.tutor === 'object' && subject.tutor._id) {
            tutors.set(subject.tutor._id, subject.tutor);
          }
        });
        return Array.from(tutors.values());
      })
    );
  }

  onFileSelected(file: File): void {
    this.selectedFile = file;
    this.createMissionForm.patchValue({ document: this.selectedFile });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onSave(): void {
    if (this.createMissionForm.invalid || this.isSaving) {
      return;
    }

    if (this.isEditMode) {
      this.updateMission();
    } else {
      this.createMission();
    }
  }

  private createMission(): void {
    if (!this.currentUser || !this.selectedFile) {
      return;
    }
    this.isSaving = true;

    this.fileService.getPresignedUploadUrl(this.selectedFile.name, this.selectedFile.type).pipe(
      switchMap(uploadData => this.fileService.uploadFileToSignedUrl(uploadData.url, this.selectedFile!).pipe(
        switchMap(() => this.fileService.finalizeUpload(uploadData.fileKey, this.selectedFile!.name, this.selectedFile!.type))
      )),
      switchMap(document => {
        const missionPayload = {
          bundleId: this.data.bundleId,
          studentId: this.data.student._id,
          tutorId: this.createMissionForm.value.tutorId,
          remuneration: this.createMissionForm.value.remuneration,
          dateCompleted: this.createMissionForm.value.dateCompleted,
          documentId: document._id,
        };
        return this.missionService.createMission(missionPayload);
      })
    ).subscribe({
      next: (newMission) => {
        this.snackBarService.showSuccess('Mission created successfully!');
        this.dialogRef.close(newMission);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBarService.showError(err.error?.message || 'Failed to create mission.');
      }
    });
  }

  private updateMission(): void {
    const payload: Partial<IMissions> = {
      tutor: this.createMissionForm.value.tutorId,
      dateCompleted: this.createMissionForm.value.dateCompleted,
      remuneration: this.createMissionForm.value.remuneration,
      status: this.createMissionForm.value.status,
    };

    this.missionService.updateMission(this.data.mission!._id, payload).subscribe({
      next: (updatedMission) => {
        this.snackBarService.showSuccess('Mission updated successfully!');
        this.dialogRef.close(updatedMission);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackBarService.showError(err.error?.message || 'Failed to update mission.');
      }
    });
  }
}
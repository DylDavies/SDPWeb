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
import { NotificationService } from '../../../../../services/notification-service';
import { MissionService } from '../../../../../services/missions-service';
import { BundleService } from '../../../../../services/bundle-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { map } from 'rxjs/operators';
import { Observable, of } from 'rxjs';
import { AuthService } from '../../../../../services/auth-service';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';

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
    MatSelectModule, MatDatepickerModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './missions-modal.html',
  styleUrls: ['./missions-modal.scss']
})
export class MissionsModal implements OnInit {
  
  private fb = inject(FormBuilder);
  private missionService = inject(MissionService);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  private authService = inject(AuthService); // Inject AuthService
  public dialogRef = inject(MatDialogRef<MissionsModal>);
  public data: { student: IUser | IPopulatedUser, mission?: IMissions, bundleId: string } = inject(MAT_DIALOG_DATA);

  public createMissionForm: FormGroup;
  public isSaving = false;
  public isEditMode = false;
  public tutors$: Observable<IPopulatedUser[]> = of([]);
  public selectedFile: File | null = null;
  public fileName: string | null = null;
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
      status: [EMissionStatus.Active, Validators.required],
      document: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Get the current user to use as the commissioner
      this.isEditMode = !!this.data.mission;
      this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
    

    if (this.data.student) {
      this.createMissionForm.get('studentName')?.setValue(this.data.student.displayName);
      this.fetchTutorsForStudent(this.data.student._id);
    }
    if (this.isEditMode && this.data.mission) {
        this.fileName = this.data.mission.documentName;
        const tutor = this.data.mission.tutor;
        const tutorId = typeof tutor === 'object' ? tutor._id : tutor;

        this.createMissionForm.patchValue({
            tutorId: tutorId,
            dateCompleted: this.data.mission.dateCompleted,
            remuneration: this.data.mission.remuneration,
            status: this.data.mission.status
        });
    } else {
        this.createMissionForm.get('document')?.clearValidators();
        this.createMissionForm.get('document')?.setValidators(Validators.required);
    }
    
  }

  private fetchTutorsForStudent(studentId: string): void {
    this.tutors$ = this.bundleService.getBundles().pipe(
      map(bundles => {
        const tutors = new Map<string, IPopulatedUser>();
        bundles
          .filter(bundle => (bundle.student as IPopulatedUser)?._id === studentId)
          .forEach(bundle => {
            bundle.subjects.forEach(subject => {
              if (typeof subject.tutor === 'object') {
                tutors.set(subject.tutor._id, subject.tutor);
              }
            });
          });
        return Array.from(tutors.values());
      })
    );
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      this.selectedFile = fileList[0];
      this.fileName = this.selectedFile.name;
      this.createMissionForm.patchValue({ document: this.selectedFile });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
  onSave(): void {
    if (this.createMissionForm.invalid || this.isSaving) {
      return;
    }
    console.log("Clicked");
    console.log(this.data.bundleId);

    if (this.isEditMode) {
      console.log("update");
      this.updateMission();
    } else {
      console.log("create");
      this.createMission();
    }
  }

  private createMission(): void {
    if (this.createMissionForm.invalid || this.isSaving || !this.currentUser || !this.selectedFile) {
      console.log("broken");
      return;
    }
    this.isSaving = true;
    console.log(this.data.bundleId);
    const formData = new FormData();
    formData.append('document', this.selectedFile, this.fileName!);
    formData.append('bundleId', this.data.bundleId);
    formData.append('studentId', this.data.student._id);
    formData.append('tutorId', this.createMissionForm.value.tutorId);
    formData.append('remuneration', this.createMissionForm.value.remuneration);
    formData.append('dateCompleted', this.createMissionForm.value.dateCompleted.toISOString());

    this.missionService.createMission(formData).subscribe({
      next: (newMission) => {
        this.notificationService.showSuccess('Mission created successfully!');
        this.dialogRef.close(newMission);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to create mission.');
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
              this.notificationService.showSuccess('Mission updated successfully!');
              this.dialogRef.close(updatedMission);
          },
          error: (err) => {
              this.isSaving = false;
              this.notificationService.showError(err.error?.message || 'Failed to update mission.');
          }
      });
  }
}
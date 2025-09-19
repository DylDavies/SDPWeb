import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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
  public data: { student: IUser } = inject(MAT_DIALOG_DATA);

  public createMissionForm: FormGroup;
  public isSaving = false;
  public tutors$: Observable<IPopulatedUser[]> = of([]);
  public selectedFile: File | null = null;
  public fileName: string | null = null;
  private currentUser: IUser | null = null;

  constructor() {
    this.createMissionForm = this.fb.group({
      studentName: [{ value: '', disabled: true }, Validators.required],
      tutorId: ['', Validators.required],
      dateCompleted: ['', Validators.required],
      remuneration: ['', [Validators.required, Validators.min(0)]],
      document: [null, Validators.required]
    });
  }

  ngOnInit(): void {
    // Get the current user to use as the commissioner
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    if (this.data.student) {
      this.createMissionForm.get('studentName')?.setValue(this.data.student.displayName);
      this.fetchTutorsForStudent(this.data.student._id);
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

  onCreate(): void {
    if (this.createMissionForm.invalid || this.isSaving || !this.currentUser || !this.selectedFile) {
      return;
    }
    this.isSaving = true;

    const formData = new FormData();
    formData.append('document', this.selectedFile, this.fileName!);
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
}
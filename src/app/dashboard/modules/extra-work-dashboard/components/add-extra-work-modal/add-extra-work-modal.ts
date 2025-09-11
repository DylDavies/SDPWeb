import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { NotificationService } from '../../../../../services/notification-service';
import { UserService } from '../../../../../services/user-service';
import { ExtraWorkService } from '../../../../../services/extra-work';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { IExtraWork } from '../../../../../models/interfaces/IExtraWork.interface';

@Component({
  selector: 'app-add-extra-work-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './add-extra-work-modal.html',
  styleUrl: './add-extra-work-modal.scss'
})
export class AddExtraWorkModal implements OnInit {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private extraWorkService = inject(ExtraWorkService);
  private notificationService = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<AddExtraWorkModal>);

  public addWorkForm: FormGroup;
  public isSaving = false;

  public students$: Observable<IUser[]>;
  public commissioners$: Observable<IUser[]>;

  public workTypes: string[] = [
    "Customer Gifts", "GFP", "Invigilation", "Lesson Consumables",
    "Marketing Content Creation", "Marketing Grind", "Marking", "Misc",
    "Office Sitting", "Phone Elf", "Recruitment Grind", "Research and Development",
    "SLM and GEM Excursions", "Staff Gifts", "Student Materials",
    "Test & Resource Creation", "Tutor Materials"
  ];

  constructor() {
    this.addWorkForm = this.fb.group({
      studentId: ['', Validators.required],
      commissionerId: ['', Validators.required],
      workType: ['', Validators.required],
      details: ['', [Validators.required, Validators.maxLength(280)]],
      remuneration: [null, [Validators.required, Validators.min(0)]]
    });

    // Fetch and filter students (clients)
    this.students$ = this.userService.allUsers$.pipe(
      map(users => users.filter(user => user.type === EUserType.Client))
    );

    // Fetch and filter commissioners (users with approve permission)
    this.commissioners$ = this.userService.allUsers$.pipe(
      map(users => users.filter(user =>
        user.permissions.includes(EPermission.EXTRA_WORK_APPROVE) || user.type === EUserType.Admin
      ))
    );
  }

  ngOnInit(): void {
    // Ensure the user list is fresh when the modal opens
    this.userService.fetchAllUsers().subscribe();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.addWorkForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;

    const payload: Partial<IExtraWork> = this.addWorkForm.value;

    this.extraWorkService.createExtraWork(payload).subscribe({
      next: (newWorkItem) => {
        this.notificationService.showSuccess('Extra work entry created successfully!');
        this.dialogRef.close(newWorkItem);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to create entry.');
      }
    });
  }
}
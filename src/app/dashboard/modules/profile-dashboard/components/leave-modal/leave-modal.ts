// src/app/leave-modal/leave-modal.ts
import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, Validators, FormGroup, ReactiveFormsModule, AbstractControl, ValidatorFn, ValidationErrors } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { UserService } from '../../../../../services/user-service';
import { provideNativeDateAdapter } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { ILeave } from '../../../../../models/interfaces/ILeave.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';

export function dateRangeValidator(existingLeave: ILeave[]): ValidatorFn {return (control: AbstractControl): ValidationErrors | null => {
  const startDate = control.get('startDate')?.value;
  const endDate = control.get('endDate')?.value;

  if ((startDate && endDate && new Date(startDate) > new Date(endDate))) {
    return { invalidRange: true };
  }
  const overlap = existingLeave.some(leave => {
      const leaveStart = new Date(leave.startDate);
      const leaveEnd = new Date(leave.endDate);

      return startDate <= leaveEnd && endDate >= leaveStart;
    });

    if (overlap) {
      return { invalidRange: true };
    }

  return null;
};
}


@Component({
  selector: 'app-leave-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './leave-modal.html',
  styleUrls: ['./leave-modal.scss'],
  providers: [provideNativeDateAdapter()],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LeaveModal implements OnInit {
  public user: IUser = inject(MAT_DIALOG_DATA);
  
  minDate = new Date();
  leaveForm = new FormGroup({
    name: new FormControl({ value: '', disabled: true}), 
    reason: new FormControl('', [Validators.required]),
    startDate: new FormControl(null, [Validators.required]),
    endDate: new FormControl(null, [Validators.required]),
  },
  
  
   { validators: dateRangeValidator(this.user.leave || []) });
 

  public dialogRef = inject(MatDialogRef<LeaveModal>);
  private userService = inject(UserService);
  public userId: string = inject(MAT_DIALOG_DATA);
  
  
  public data: { leave: ILeave, user: IUser, mode: 'create' | 'view' } = inject(MAT_DIALOG_DATA);
  public isAdmin = false;
  ngOnInit(): void {
    this.userService.getUser().subscribe({
      next: (user: IUser) => {
        if (user && user.displayName) {
          this.leaveForm.get('name')?.setValue(user.displayName);
        }
      },
      error: (err) => {
        console.error('Failed to get user data for autofill.', err);
      },
    });
  }

  onSubmit(): void {
    if (this.leaveForm.valid) {
      const { reason, startDate, endDate } = this.leaveForm.value;
      if (reason && startDate && endDate) {
        const leaveData = {
          reason: reason,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        };

        this.userService.requestLeave(this.userId, leaveData).subscribe({
          next: (response) => {
            console.log('Leave request submitted successfully', response);
            this.dialogRef.close(true);
          },
          error: (error) => {
            console.error('Error submitting leave request:', error);
          },
        });
      }
    } else {
      this.leaveForm.markAllAsTouched();
    }
  }
  
}
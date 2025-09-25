import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { IExtraWork, EExtraWorkStatus } from '../../../../../models/interfaces/IExtraWork.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-view-extra-work-modal',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './view-extra-work-modal.html',
  styleUrls: ['./view-extra-work-modal.scss']
})
export class ViewExtraWorkModal {
  public dialogRef = inject(MatDialogRef<ViewExtraWorkModal>);
  public data: { item: IExtraWork, canEdit: boolean } = inject(MAT_DIALOG_DATA);

  public EExtraWorkStatus = EExtraWorkStatus;
  public selectedDate: Date | null = null;
  public today = new Date();

  getStudentName(): string {
    const student = this.data.item.studentId as IPopulatedUser;
    return student?.displayName || 'N/A';
  }

  getCommissionerName(): string {
    const commissioner = this.data.item.commissionerId as IPopulatedUser;
    return commissioner?.displayName || 'N/A';
  }

  // 👇 ADD THIS NEW METHOD
  getCreatorName(): string {
    const creator = this.data.item.userId as IPopulatedUser;
    return creator?.displayName || 'N/A';
  }

  onDateSelected(date: Date | null): void {
    this.selectedDate = date;
  }

  onSetCompleteDate(): void {
    if (this.selectedDate) {
      this.dialogRef.close(this.selectedDate);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
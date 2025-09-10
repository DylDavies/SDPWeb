import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BadgeService } from '../../../../../services/badge-service';
import { NotificationService } from '../../../../../services/notification-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-create-edit-badge-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSlideToggleModule,
    MatDatepickerModule,
    MatIconModule
  ],
  providers: [provideNativeDateAdapter()],
  templateUrl: './create-edit-badge-dialog.html',
  styleUrls: ['./create-edit-badge-dialog.scss'],
})
export class CreateEditBadgeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private badgeService = inject(BadgeService);
  private notificationService = inject(NotificationService);
  public dialogRef = inject(MatDialogRef<CreateEditBadgeDialogComponent>);
  public data: { badge?: IBadge } = inject(MAT_DIALOG_DATA);

  public badgeForm!: FormGroup;
  public isEditMode = false;

  ngOnInit(): void {
    this.isEditMode = !!this.data?.badge;

    this.badgeForm = this.fb.group({
      name: ['', Validators.required],
      TLA: ['', Validators.required],
      summary: ['', Validators.required],
      description: ['', Validators.required],
      image: ['', Validators.required],
      permanent: [false],
      expirationDate: [null],
      bonus: [0, Validators.required],
    });

    if (this.isEditMode) {
      this.badgeForm.patchValue(this.data.badge as any);
    }
  }

  onSave(): void {
    if (this.badgeForm.invalid) {
      return;
    }

    const badgeData = { ...this.badgeForm.value };
    if (this.isEditMode && this.data.badge) {
      badgeData._id = this.data.badge._id;
    }

    this.badgeService.addOrUpdateBadge(badgeData).subscribe(() => {
      this.notificationService.showSuccess(`Badge ${this.isEditMode ? 'updated' : 'created'} successfully.`);
      this.dialogRef.close(true);
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}

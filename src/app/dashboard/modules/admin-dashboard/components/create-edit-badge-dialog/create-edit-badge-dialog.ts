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
import { MatTooltipModule } from '@angular/material/tooltip';

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
    MatIconModule,
    MatTooltipModule
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

  // List of icons to choose from 
  public availableIcons: string[] = [
    'military_tech', 'workspace_premium', 'verified', 'star', 'emoji_events', 
    'school', 'auto_stories', 'rocket_launch', 'thumb_up', 'favorite',
    'support_agent', 'biotech', 'build_circle', 'code', 'psychology',
    'bolt', 'local_fire_department', 'shield', 'public', 'diamond', 'accessible'
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.data?.badge;

    this.badgeForm = this.fb.group({
      name: ['', Validators.required],
      TLA: ['', Validators.required],
      summary: ['', Validators.required],
      description: ['', Validators.required],
      icon: ['', Validators.required],
      permanent: [false],
      expirationDate: [null],
      bonus: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    if (this.isEditMode && this.data.badge) {
      this.badgeForm.patchValue(this.data.badge as unknown as Record<string, unknown>);
    }
  }

  selectIcon(icon: string):void{
    this.badgeForm.get('icon')?.setValue(icon);
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
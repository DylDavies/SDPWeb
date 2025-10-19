import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { BadgeService } from '../../../../../services/badge-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackBarService } from '../../../../../services/snackbar-service';

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
    MatIconModule,
    MatTooltipModule
  ],
  templateUrl: './create-edit-badge-dialog.html',
  styleUrls: ['./create-edit-badge-dialog.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateEditBadgeDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private badgeService = inject(BadgeService);
  private snackbarService = inject(SnackBarService);
  public dialogRef = inject(MatDialogRef<CreateEditBadgeDialogComponent>);
  public data: { badge?: IBadge } = inject(MAT_DIALOG_DATA);

  public badgeForm!: FormGroup;
  public isEditMode = false;

  public availableIcons: string[] = [
    'military_tech', 'workspace_premium', 'verified', 'star', 'emoji_events', 
    'school', 'auto_stories', 'rocket_launch', 'thumb_up', 'favorite',
    'support_agent', 'biotech', 'build_circle', 'code', 'psychology',
    'bolt', 'local_fire_department', 'shield', 'public', 'diamond', 'accessible'
  ];

  ngOnInit(): void {
    this.isEditMode = !!this.data?.badge;

    this.badgeForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(40)]],
      TLA: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(3)]],
      summary: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', Validators.required],
      image: ['', Validators.required],
      permanent: [false],
      duration: [null, [Validators.required, Validators.min(1), Validators.max(3650)]], 
      bonus: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    if (!this.isEditMode) {
      this.badgeForm.addControl('requirements', this.fb.control('', Validators.required));
    }

    // Duration on appears when is permanent is false
    this.badgeForm.get('permanent')?.valueChanges.subscribe(isPermanent => {
      const durationControl = this.badgeForm.get('duration');
      if (isPermanent) {
        durationControl?.clearValidators();
        durationControl?.setValue(null); 
      } 
      else {
        durationControl?.setValidators([Validators.required, Validators.min(1), Validators.max(3650)]);
      }
      durationControl?.updateValueAndValidity();
    });

    if (this.isEditMode && this.data.badge) {
      this.badgeForm.patchValue(this.data.badge);
      this.badgeForm.get('permanent')?.updateValueAndValidity(); 
    }
  }

  selectIcon(icon: string): void {
    this.badgeForm.get('image')?.setValue(icon);
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
      this.snackbarService.showSuccess(`Badge ${this.isEditMode ? 'updated' : 'created'} successfully.`);
      this.dialogRef.close(true);
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
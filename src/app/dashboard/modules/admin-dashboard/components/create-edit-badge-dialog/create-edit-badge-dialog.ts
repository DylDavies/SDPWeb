import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { BadgeService } from '../../../../../services/badge-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { SnackBarService } from '../../../../../services/snackbar-service';

export function futureDateValidator(): ValidatorFn {
  return (control: AbstractControl): Record<string, unknown> | null => {
    if (!control.value) {
      return null; 
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const selectedDate = new Date(control.value);

    return selectedDate < today ? { pastDate: true } : null;
  };
}

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
      expirationDate: [null, [futureDateValidator()]],
      bonus: [0, [Validators.required, Validators.min(0), Validators.max(100)]],
    });

    if (!this.isEditMode) {
      this.badgeForm.addControl('requirements', this.fb.control(''));
    }

    this.badgeForm.get('permanent')?.valueChanges.subscribe(isPermanent => {
      const expirationDateControl = this.badgeForm.get('expirationDate');
      if (!isPermanent) {
        expirationDateControl?.setValidators([Validators.required, futureDateValidator()]);
      }
      else{

        expirationDateControl?.setValidators([futureDateValidator()]);
        expirationDateControl?.setValue(null); 
      }

      expirationDateControl?.updateValueAndValidity();
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
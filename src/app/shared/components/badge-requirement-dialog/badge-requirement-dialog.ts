import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { BadgeService } from '../../../services/badge-service';
import { SnackBarService } from '../../../services/snackbar-service';

@Component({
  selector: 'app-badge-requirement-dialog',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatIconModule,
    MatButtonModule, MatFormFieldModule, MatInputModule, MatProgressSpinnerModule
  ],
  templateUrl: './badge-requirement-dialog.html',
  styleUrl: './badge-requirement-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BadgeRequirementDialogComponent implements OnInit {
  public data: { badge: IBadge, isEditable: boolean } = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<BadgeRequirementDialogComponent>);
  private badgeService = inject(BadgeService);
  private snackbarService = inject(SnackBarService);
  private fb = inject(FormBuilder);

  public isLoading = true;
  public requirementsText = '';
  public form!: FormGroup;

  ngOnInit(): void {
    if (this.data.isEditable) {
      this.form = this.fb.group({
        requirements: ['']
      });
    }
    
    this.badgeService.getBadgeRequirements(this.data.badge._id).subscribe(res => {
      this.requirementsText = res.requirements;
      if (this.data.isEditable) {
        this.form.patchValue({ requirements: res.requirements });
      }
      this.isLoading = false;
    });
  }

  onSave(): void {
    if (this.form.invalid) return;

    this.isLoading = true;
    const newRequirements = this.form.value.requirements;
    
    this.badgeService.updateBadgeRequirements(this.data.badge._id, newRequirements).subscribe({
      next: () => {
        this.snackbarService.showSuccess("Requirements updated successfully.");
        this.dialogRef.close(true);
      },
      error: () => {
        this.snackbarService.showError("Failed to update requirements.");
        this.isLoading = false;
      }
    });
  }
}
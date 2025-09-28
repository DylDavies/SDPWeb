import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { tap } from 'rxjs';

export interface RateAdjustmentDialogData {
  user: IUser;
}

@Component({
  selector: 'app-rate-adjustment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './rate-adjustment-dialog.component.html',
  styleUrls: ['./rate-adjustment-dialog.component.scss']
})
export class RateAdjustmentDialogComponent {
  private fb = inject(FormBuilder);
  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);
  private dialogRef = inject(MatDialogRef<RateAdjustmentDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as RateAdjustmentDialogData;

  public user: IUser;
  public rateAdjustmentForm: FormGroup;
  public isSubmitting = false;

  constructor() {
    this.user = this.data.user;
    this.rateAdjustmentForm = this.createForm();
  }

  private createForm(): FormGroup {
    const currentRate = this.getCurrentRate();

    return this.fb.group({
      reason: ['', [Validators.required, Validators.minLength(5)]],
      newRate: [currentRate, [Validators.required, Validators.min(0.01), Validators.max(1000.01)]]
    });
  }

  /**
   * Get the user's current rate (most recent rate adjustment)
   */
  private getCurrentRate(): number {
    if (!this.user.rateAdjustments || this.user.rateAdjustments.length === 0) {
      return 0;
    }
    return this.user.rateAdjustments[0].newRate;
  }

  /**
   * Get the user's current rate for display
   */
  public get currentRateDisplay(): string {
    const rate = this.getCurrentRate();
    return rate > 0 ? `R${rate.toFixed(2)}/hr` : 'No rate set';
  }

  /**
   * Submit the rate adjustment
   */
  public onSubmit(): void {
    if (this.rateAdjustmentForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      const formValue = this.rateAdjustmentForm.value;

      const rateAdjustment = {
        reason: formValue.reason,
        newRate: formValue.newRate,
        effectiveDate: new Date().toISOString() // Set to current date/time for immediate effect
      };

      this.userService.addRateAdjustment(this.user._id, rateAdjustment).pipe(
        tap(() => {
          this.snackbarService.showSuccess(
            `Rate adjusted for ${this.user.displayName} to R${formValue.newRate.toFixed(2)}/hr`
          );
          this.dialogRef.close(true);
        })
      ).subscribe({
        error: (_error) => {
          this.snackbarService.showError('Failed to adjust rate. Please try again.');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Close the dialog without saving
   */
  public onCancel(): void {
    this.dialogRef.close(false);
  }

  /**
   * Check if the new rate is different from the current rate
   */
  public get isRateChanged(): boolean {
    const currentRate = this.getCurrentRate();
    const newRate = this.rateAdjustmentForm.get('newRate')?.value;
    return currentRate !== newRate;
  }

  /**
   * Handle keydown events to prevent entering more than 2 decimal places
   */
  public onRateKeydown(event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Allow navigation and control keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow numbers and decimal point
    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (event.key === '.' && value.includes('.')) {
      event.preventDefault();
      return;
    }

    // Prevent more than 2 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      const decimalPart = parts[1];
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // If we're typing after the decimal point and already have 2 digits
      if (decimalPart && decimalPart.length >= 2) {
        // Allow if we're replacing selected text or typing before the decimal
        if (selectionStart === selectionEnd && selectionStart > value.indexOf('.') + 2) {
          event.preventDefault();
          return;
        }
      }
    }
  }

  /**
   * Handle rate input to clean up any formatting issues
   */
  public onRateInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;
    if (value && value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        // Truncate to 2 decimal places
        const limitedValue = parts[0] + '.' + parts[1].substring(0, 2);
        this.rateAdjustmentForm.get('newRate')?.setValue(parseFloat(limitedValue));
        // Update the input field
        target.value = limitedValue;
      }
    }
  }
}
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { tap } from 'rxjs';
import { IPayslip, INote } from '../../../../../models/interfaces/IPayslip.interface';
import { PayslipService } from '../../../../../services/payslip-service';
import { SnackBarService } from '../../../../../services/snackbar-service';

// A helper interface for our dropdown items
interface IQueryItem {
  id: string; // We'll use the description as a unique ID for the line item
  viewValue: string;
}

@Component({
  selector: 'app-submit-query-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule
  ],
  templateUrl: './submit-query-dialog.html',
  styleUrl: './submit-query-dialog.scss'
})
export class SubmitQueryDialogComponent {

  public queryForm: FormGroup;
  public queryableItems: IQueryItem[] = [];

  private fb = inject(FormBuilder);
  private payslipService = inject(PayslipService);
  private snackbarService = inject(SnackBarService);
  public dialogRef = inject(MatDialogRef<SubmitQueryDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as {
    payslip: IPayslip;
    selectedItem?: {description: string; amount?: number};
    itemType?: 'earning' | 'bonus' | 'deduction' | 'general';
    itemIndex?: number;
    existingQuery?: INote;
  };

  constructor() {
    // Create a unique ID for the selected item
    let preselectedItemId = '';
    let preselectedItemName = '';

    if (this.data.selectedItem && this.data.itemType && this.data.itemIndex !== undefined) {
      preselectedItemId = `${this.data.itemType}-${this.data.itemIndex}`;
      preselectedItemName = this.data.selectedItem.description;
    }

    // Pre-fill with existing query data if editing
    const existingNote = this.data.existingQuery ? this.data.existingQuery.note : '';

    this.queryForm = this.fb.group({
      itemId: [preselectedItemId, this.data.itemType !== 'general' ? Validators.required : null],
      note: [existingNote, Validators.required]
    });

    // If item is preselected, also show the item name in the form
    if (preselectedItemName) {
      this.selectedItemName = preselectedItemName;
    }

    // Set edit mode if there's an existing query
    this.isEditMode = !!this.data.existingQuery;

    // Populate the dropdown with current payslip items
    this.populateQueryableItems();
  }

  public selectedItemName = '';
  public isEditMode = false;

  private populateQueryableItems(): void {
    this.queryableItems = [];

    // Add earnings
    (this.data.payslip.earnings || []).forEach((earning, index) => {
      this.queryableItems.push({
        id: `earning-${index}`,
        viewValue: `Earning: ${earning.description}`
      });
    });

    // Add bonuses
    (this.data.payslip.bonuses || []).forEach((bonus, index) => {
      this.queryableItems.push({
        id: `bonus-${index}`,
        viewValue: `Bonus: ${bonus.description}`
      });
    });

    // Add deductions
    (this.data.payslip.deductions || []).forEach((deduction, index) => {
      this.queryableItems.push({
        id: `deduction-${index}`,
        viewValue: `Deduction: ${deduction.description}`
      });
    });

    // Add general payslip option
    this.queryableItems.push({
      id: 'general-payslip',
      viewValue: 'General Payslip Query'
    });
  }

  public onSubmit(): void {
    if (this.queryForm.invalid) {
      return;
    }
    const { itemId, note } = this.queryForm.value;

    if (this.isEditMode && this.data.existingQuery) {
      // Update existing query
      this.payslipService.updateQuery(this.data.payslip._id, this.data.existingQuery._id!, note).pipe(
        tap(() => {
          this.snackbarService.showSuccess('Query updated successfully.');
          this.dialogRef.close(true);
        })
      ).subscribe();
    } else {
      // Create new query
      this.payslipService.addQuery(this.data.payslip._id, itemId, note).pipe(
        tap(() => {
          this.snackbarService.showSuccess('Query submitted successfully.');
          this.dialogRef.close(true);
        })
      ).subscribe();
    }
  }

  public onCancel(): void {
    this.dialogRef.close();
  }

  public onDelete(): void {
    if (this.data.existingQuery?._id) {
      this.payslipService.deleteQuery(this.data.payslip._id, this.data.existingQuery._id!).pipe(
        tap(() => {
          this.snackbarService.showSuccess('Query deleted successfully.');
          this.dialogRef.close(true);
        })
      ).subscribe();
    }
  }

  public onResolve(): void {
    if (this.data.existingQuery?._id) {
      this.payslipService.resolveQuery(this.data.payslip._id, this.data.existingQuery._id!, 'Query marked as resolved by user.').pipe(
        tap(() => {
          this.snackbarService.showSuccess('Query marked as resolved.');
          this.dialogRef.close(true);
        })
      ).subscribe();
    }
  }
}
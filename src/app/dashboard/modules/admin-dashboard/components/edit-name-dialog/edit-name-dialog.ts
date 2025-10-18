import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-edit-name-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule
  ],
  templateUrl: './edit-name-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditNameDialog {
  public dialogRef = inject(MatDialogRef<EditNameDialog>);
  public data: { name: string } = inject(MAT_DIALOG_DATA);
  name: string;

  constructor() {
    this.name = this.data.name;
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.name.trim()) {
      this.dialogRef.close(this.name.trim());
    }
  }
}
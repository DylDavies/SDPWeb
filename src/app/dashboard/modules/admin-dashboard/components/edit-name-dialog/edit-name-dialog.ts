import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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
})
export class EditNameDialog {
  name: string;

  constructor(
    public dialogRef: MatDialogRef<EditNameDialog>,
    @Inject(MAT_DIALOG_DATA) public data: { name: string }
  ) {
    this.name = data.name;
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
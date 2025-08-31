import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
@Component({
  selector: 'app-conformation-dialog',
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './confirmation-dialog.html',
  styleUrl: './confirmation-dialog.scss',
  standalone: true
})
export class ConfirmationDialog {
  public dialogRef = inject(MatDialogRef<ConfirmationDialog>);
  public data: {
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    color?: 'primary' | 'accent' | 'warn';
    icon?: string;
  } = inject(MAT_DIALOG_DATA);

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onDismiss(): void {
    this.dialogRef.close(false);
  }
}

import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-badge-detail-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    DatePipe, 
    MatDialogModule, 
    MatIconModule, 
    MatButtonModule, 
    MatDividerModule,
    MatTooltipModule
  ],
  templateUrl: './badge-detail-dialog.html',
  styleUrls: ['./badge-detail-dialog.scss'],
})
export class BadgeDetailDialogComponent {
  public data: { badge: IBadge } = inject(MAT_DIALOG_DATA);
  public dialogRef = inject(MatDialogRef<BadgeDetailDialogComponent>);
}
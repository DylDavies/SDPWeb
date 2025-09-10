import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';

@Component({
  selector: 'app-badge-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule],
  templateUrl: './badge-detail-dialog.html',
  styleUrls: ['./badge-detail-dialog.scss'],
})
export class BadgeDetailDialogComponent {
  public data: { badge: IBadge } = inject(MAT_DIALOG_DATA);
}
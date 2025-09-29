import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IUserBadge } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-badge-detail-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule, MatDividerModule, MatTooltipModule],
  templateUrl: './badge-detail-dialog.html',
  styleUrls: ['./badge-detail-dialog.scss']
})
export class BadgeDetailDialogComponent implements OnInit {
  public expirationDate: string | null = null;
  public expirationDisplay: string | null = null;

  private dialogRef = inject(MatDialogRef<BadgeDetailDialogComponent>);
  public data: { badge: IBadge, userBadge?: IUserBadge } = inject(MAT_DIALOG_DATA);

  ngOnInit(): void {
    this.setupExpirationDisplay();
  }

  /**
   * Sets up the correct expiration text based on the context (profile vs. library).
   */
  private setupExpirationDisplay(): void {
    const { badge, userBadge } = this.data;

    if (badge.permanent) {
      this.expirationDisplay = 'Permanent';
      return;
    }

    // Profile display with a temporary badge
    if (userBadge && badge.duration) {
      const dateAdded = new Date(userBadge.dateAdded);
      const expiration = new Date(dateAdded);
      expiration.setDate(dateAdded.getDate() + badge.duration);

      this.expirationDate = expiration.toLocaleDateString('en-US', {
        year: 'numeric', month: 'long', day: 'numeric'
      });

      const today = new Date();
      const timeDiff = expiration.getTime() - today.getTime();
      const daysLeft = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysLeft <= 0) {
        this.expirationDisplay = 'Expired';
      } else {
        this.expirationDisplay = `${daysLeft} day${daysLeft > 1 ? 's' : ''}`;
      }
      return;
    }

    // Badge library text for badge detail duration display
    if (!userBadge && badge.duration) {
      this.expirationDisplay = `${badge.duration} days`;
      this.expirationDate = 'from date awarded'; 
      return;
    }

    this.expirationDisplay = 'Temporary';
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
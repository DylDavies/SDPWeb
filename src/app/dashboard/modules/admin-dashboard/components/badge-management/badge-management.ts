import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { BadgeService } from '../../../../../services/badge-service';
import { CreateEditBadgeDialogComponent } from '../create-edit-badge-dialog/create-edit-badge-dialog';
import { BadgeCardComponent } from '../../../../../shared/components/badge-card/badge-card';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, BadgeCardComponent],
  templateUrl: './badge-management.html',
  styleUrls: ['./badge-management.scss'],
})
export class BadgeManagement implements OnInit {
  private badgeService = inject(BadgeService);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackBarService);

  public badges: IBadge[] = [];


  ngOnInit(): void {
    this.loadBadges();
  }

  loadBadges(): void {
    this.badgeService.getBadges().subscribe({
      next: (badges) => {
        this.badges = badges;
      },
      error: () => {
        this.snackbarService.showError('Failed to load badges.');
      }
    });
  }

  openCreateBadgeDialog(): void {
    const dialogRef = this.dialog.open(CreateEditBadgeDialogComponent, {
      width: '500px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadBadges();
      }
    });
  }
}
import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { Subscription } from 'rxjs';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { BadgeService } from '../../../../../services/badge-service';
import { CreateEditBadgeDialogComponent } from '../create-edit-badge-dialog/create-edit-badge-dialog';
import { BadgeCardComponent } from '../../../../../shared/components/badge-card/badge-card';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { TrackByUtils } from '../../../../../core/utils/trackby.utils';

@Component({
  selector: 'app-badge-management',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, BadgeCardComponent],
  templateUrl: './badge-management.html',
  styleUrls: ['./badge-management.scss'],
})
export class BadgeManagement implements OnInit, OnDestroy {
  private badgeService = inject(BadgeService);
  private dialog = inject(MatDialog);
  private snackbarService = inject(SnackBarService);
  private cdr = inject(ChangeDetectorRef);

  public badges: IBadge[] = [];
  public trackById = TrackByUtils.trackBy_id;
  private subscription = new Subscription();

  ngOnInit(): void {
    this.loadBadges();
  }

  loadBadges(): void {
    this.subscription.add(
      this.badgeService.allBadges$.subscribe({
        next: (badges) => {
          this.badges = badges;
          this.cdr.detectChanges();
        },
        error: () => {
          this.snackbarService.showError('Failed to load badges.');
        }
      })
    );
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

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
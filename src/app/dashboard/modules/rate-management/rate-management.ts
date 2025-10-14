import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Observable, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { RateAdjustmentDialogComponent } from './components/rate-adjustment-dialog/rate-adjustment-dialog.component';
import { RateHistoryDialogComponent } from './components/rate-history-dialog/rate-history-dialog.component';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-rate-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatTooltipModule,
    MatDialogModule,
    MatChipsModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatSortModule
  ],
  templateUrl: './rate-management.html',
  styleUrls: ['./rate-management.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RateManagementComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private breakpointObserver = inject(BreakpointObserver);
  private cdRef = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  public users$: Observable<IUser[]> = this.userService.allUsers$;
  public filteredUsers: IUser[] = [];
  public displayedColumns: string[] = ['picture', 'displayName', 'email', 'currentRate', 'lastAdjustment', 'actions'];
  public isMobile = false;

  // Search, pagination and sorting properties
  public searchTerm = '';
  public currentPage = 0;
  public pageSize = 10;
  public totalUsers = 0;
  private allUsers: IUser[] = [];
  private currentSort: Sort = { active: 'displayName', direction: 'asc' };

  ngOnInit(): void {
    // Ensure users are loaded and subscribe to changes
    this.userService.fetchAllUsers().subscribe();

    this.users$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(users => {
      this.allUsers = users;
      this.totalUsers = users.length;
      this.applyFilters();
    });

    this.breakpointObserver.observe([
      Breakpoints.Handset,
      Breakpoints.Tablet
    ]).pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.isMobile = result.matches;
      this.cdRef.markForCheck();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Get the current rate for a user (most recent rate adjustment)
   */
  public getCurrentRate(user: IUser): number {
    if (!user.rateAdjustments || user.rateAdjustments.length === 0) {
      return 0;
    }

    // Rate adjustments are sorted by effective date (most recent first) in the backend
    return user.rateAdjustments[0].newRate;
  }

  /**
   * Get the last rate adjustment date for a user
   */
  public getLastAdjustmentDate(user: IUser): Date | null {
    if (!user.rateAdjustments || user.rateAdjustments.length === 0) {
      return null;
    }

    return user.rateAdjustments[0].effectiveDate;
  }

  /**
   * Open the rate adjustment dialog for a user
   */
  public openRateAdjustmentDialog(user: IUser): void {
    const dialogRef = this.dialog.open(RateAdjustmentDialogComponent, {
      width: '600px',
      data: { user }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Dialog will handle the API call and refresh
      }
    });
  }

  /**
   * View rate adjustment history for a user
   */
  public viewRateHistory(user: IUser): void {
    this.dialog.open(RateHistoryDialogComponent, {
      width: '1200px',
      maxWidth: '90vw',
      data: { user }
    });
  }

  /**
   * Handle search input changes
   */
  public onSearchChange(): void {
    this.currentPage = 0;
    this.applyFilters();
  }

  /**
   * Handle pagination changes
   */
  public onPageChange(event: PageEvent): void {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.applyFilters();
  }

  /**
   * Handle sorting changes
   */
  public onSortChange(sort: Sort): void {
    this.currentSort = sort;
    this.currentPage = 0;
    this.applyFilters();
  }

  /**
   * Apply search, sorting and pagination filters
   */
  private applyFilters(): void {
    let filtered = this.allUsers;

    // Apply search filter
    if (this.searchTerm.trim()) {
      const search = this.searchTerm.toLowerCase().trim();
      filtered = filtered.filter(user =>
        user.displayName.toLowerCase().includes(search) ||
        user.email.toLowerCase().includes(search)
      );
    }

    // Apply sorting
    if (this.currentSort.active && this.currentSort.direction) {
      filtered = filtered.sort((a, b) => {
        const isAsc = this.currentSort.direction === 'asc';

        switch (this.currentSort.active) {
          case 'displayName':
            return this.compare(a.displayName, b.displayName, isAsc);
          case 'email':
            return this.compare(a.email, b.email, isAsc);
          case 'currentRate': {
            const rateA = this.getCurrentRate(a);
            const rateB = this.getCurrentRate(b);
            return this.compare(rateA, rateB, isAsc);
          }
          case 'lastAdjustment': {
            const dateA = this.getLastAdjustmentDate(a);
            const dateB = this.getLastAdjustmentDate(b);
            return this.compare(dateA?.getTime() || 0, dateB?.getTime() || 0, isAsc);
          }
          default:
            return 0;
        }
      });
    }

    this.totalUsers = filtered.length;

    // Apply pagination
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.filteredUsers = filtered.slice(startIndex, endIndex);
  }

  /**
   * Compare function for sorting
   */
  private compare(a: string | number, b: string | number, isAsc: boolean): number {
    return (a < b ? -1 : 1) * (isAsc ? 1 : -1);
  }

  /**
   * Track by function for ngFor performance
   */
  public trackByUserId(index: number, user: IUser): string {
    return user._id;
  }
}
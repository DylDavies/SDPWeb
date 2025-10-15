import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { Observable, of, Subject } from 'rxjs';
import { map, switchMap, catchError, takeUntil } from 'rxjs/operators';
import { UserService } from '../../../../../services/user-service';
import { IUser, IRateAdjustment } from '../../../../../models/interfaces/IUser.interface';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

export interface RateHistoryDialogData {
  user: IUser;
}

@Component({
  selector: 'app-rate-history-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatCardModule, 
    CurrencyPipe, 
    DatePipe 
  ],
  templateUrl: './rate-history-dialog.component.html',
  styleUrls: ['./rate-history-dialog.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RateHistoryDialogComponent implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<RateHistoryDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as RateHistoryDialogData;
  private breakpointObserver = inject(BreakpointObserver);
  private cdRef = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  public user: IUser;
  public adjustmentsWithApproverNames$: Observable<IRateAdjustment[]>;
  public displayedColumns: string[] = ['effectiveDate', 'rate', 'reason', 'approvingManager'];
  public isMobile = false;

  constructor() {
    this.user = this.data.user;
    this.adjustmentsWithApproverNames$ = this.getAdjustmentsWithApproverNames();
  }

  ngOnInit(): void {
    this.breakpointObserver.observe([
      Breakpoints.XSmall,
      Breakpoints.Small
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
   * Get rate adjustments with approver names resolved
   */
  private getAdjustmentsWithApproverNames(): Observable<IRateAdjustment[]> {
    return this.userService.getRateAdjustments(this.user._id).pipe(
      map(adjustments => adjustments.sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())),
      switchMap(adjustments => {
        if (!adjustments || adjustments.length === 0) {
          return of([]);
        }

        // Fetch all users to get approver names
        return this.userService.allUsers$.pipe(
          map((allUsers: IUser[]) => {
            return adjustments.map(adjustment => {
              const approver = allUsers.find(user => user._id === adjustment.approvingManagerId);
              return {
                ...adjustment,
                approverName: approver ? approver.displayName : 'Unknown User',
                approverEmail: approver ? approver.email : ''
              } as IRateAdjustment;
            });
          }),
          catchError(() => {
            // Fallback: return adjustments with IDs if user lookup fails
            return of(adjustments.map(adjustment => ({
              ...adjustment,
              approverName: `User ID: ${adjustment.approvingManagerId}`,
              approverEmail: ''
            } as IRateAdjustment)));
          })
        );
      })
    );
  }

  /**
   * Close the dialog
   */
  public onClose(): void {
    this.dialogRef.close();
  }
}
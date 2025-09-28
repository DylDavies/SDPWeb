import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { UserService } from '../../../../../services/user-service';
import { IUser, IRateAdjustment } from '../../../../../models/interfaces/IUser.interface';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './rate-history-dialog.component.html',
  styleUrls: ['./rate-history-dialog.component.scss']
})
export class RateHistoryDialogComponent {
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<RateHistoryDialogComponent>);
  public data = inject(MAT_DIALOG_DATA) as RateHistoryDialogData;

  public user: IUser;
  public rateAdjustments$: Observable<IRateAdjustment[]>;
  public adjustmentsWithApproverNames$: Observable<IRateAdjustment[]>;
  public displayedColumns: string[] = ['effectiveDate', 'rate', 'reason', 'approvingManager'];

  constructor() {
    this.user = this.data.user;
    this.rateAdjustments$ = this.userService.getRateAdjustments(this.user._id);
    this.adjustmentsWithApproverNames$ = this.getAdjustmentsWithApproverNames();
  }

  /**
   * Get rate adjustments with approver names resolved
   */
  private getAdjustmentsWithApproverNames(): Observable<IRateAdjustment[]> {
    return this.rateAdjustments$.pipe(
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

  /**
   * Track by function for ngFor performance
   */
  public trackByIndex(index: number): number {
    return index;
  }
}
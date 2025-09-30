import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { combineLatest, map, tap, BehaviorSubject, switchMap } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IPayslip } from '../../../../models/interfaces/IPayslip.interface';
import { PayPeriodPipe } from '../../../../pipes/pay-period-pipe';
import { PayslipStatusPipe } from '../../../../pipes/payslip-status.pipe';
import { PayslipService } from '../../../../services/payslip-service';
import { AuthService } from '../../../../services/auth-service';
import { IUser } from '../../../../models/interfaces/IUser.interface';
import { SnackBarService } from '../../../../services/snackbar-service';

@Component({
  selector: 'app-payslip-history',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PayPeriodPipe,
    PayslipStatusPipe,
    MatCardModule,
    MatTooltipModule
  ],
  templateUrl: './payslip-history.html',
  styleUrls: ['./payslip-history.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PayslipHistory {

  private payslipService = inject(PayslipService);
  private authService = inject(AuthService);
  private snackbarService = inject(SnackBarService);

  public currentUser$ = this.authService.currentUser$;
  public displayedColumns: string[] = ['payPeriod', 'status', 'totalIncome', 'totalDeductions', 'netPay', 'actions'];

  // Refresh trigger to reload data
  private refreshTrigger$ = new BehaviorSubject<void>(undefined);

  // Combined observable for current payslip and payslip history
  public pageData$ = this.refreshTrigger$.pipe(
    switchMap(() => combineLatest([
      this.payslipService.getMyPayslipHistory(),
      this.payslipService.getMyCurrentPayslip()
    ])),
    map(([payslips, currentPayslip]) => ({
      payslips,
      currentPayslip,
      hasCurrentMonthPayslip: !!currentPayslip,
      currentMonth: this.getCurrentMonthLabel()
    }))
  );

  /**
   * Check if a payslip has unresolved queries
   */
  public hasUnresolvedQueries(payslip: IPayslip): boolean {
    return payslip.notes?.some(note => !note.resolved) || false;
  }

  /**
   * Calculate total bonuses for a payslip
   */
  public getTotalBonuses(payslip: IPayslip): number {
    return payslip.bonuses?.reduce((total, bonus) => total + bonus.amount, 0) || 0;
  }

  /**
   * Calculate total misc earnings for a payslip
   */
  public getTotalMiscEarnings(payslip: IPayslip): number {
    return payslip.miscEarnings?.reduce((total, earning) => total + earning.amount, 0) || 0;
  }

  /**
   * Calculate total income (gross earnings + bonuses + misc earnings)
   */
  public getTotalIncome(payslip: IPayslip): number {
    const grossEarnings = payslip.grossEarnings || 0;
    const totalBonuses = this.getTotalBonuses(payslip);
    const totalMiscEarnings = this.getTotalMiscEarnings(payslip);
    return grossEarnings + totalBonuses + totalMiscEarnings;
  }

  /**
   * Calculate the correct net pay including misc earnings
   */
  public getCalculatedNetPay(payslip: IPayslip): number {
    const totalIncome = this.getTotalIncome(payslip);
    const totalDeductions = payslip.totalDeductions || 0;
    const paye = payslip.paye || 0;
    const uif = payslip.uif || 0;
    return totalIncome - totalDeductions - paye - uif;
  }

  /**
   * Get the user's current hourly rate (most recent rate adjustment)
   */
  public getCurrentUserRate(user: IUser | null): number {
    if (!user || !user.rateAdjustments || user.rateAdjustments.length === 0) {
      return 0;
    }

    // Find the most recent rate adjustment
    const mostRecentAdjustment = user.rateAdjustments
      .sort((a, b) => new Date(b.effectiveDate).getTime() - new Date(a.effectiveDate).getTime())[0];

    return mostRecentAdjustment.newRate;
  }

  /**
   * Get the current month label (e.g., "September 2024")
   */
  public getCurrentMonthLabel(): string {
    const now = new Date();
    return now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  /**
   * Generate a payslip for the current month
   */
  public generateCurrentPayslip(): void {
    this.payslipService.generateCurrentPayslip().pipe(
      tap((_payslip: IPayslip) => {
        this.snackbarService.showSuccess(`Payslip generated for ${this.getCurrentMonthLabel()}`);
        // Trigger a refresh of all data
        this.refreshTrigger$.next();
      })
    ).subscribe({
      error: (error) => {
        console.error('Error generating payslip:', error);
        this.snackbarService.showError('Failed to generate payslip. It may already exist or there was a server error.');
      }
    });
  }

}
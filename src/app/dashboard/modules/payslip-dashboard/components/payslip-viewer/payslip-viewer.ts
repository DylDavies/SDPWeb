import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { switchMap, map, combineLatest, tap, BehaviorSubject, take } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { EPayslipStatus } from '../../../../../models/enums/payslip-status.enum';
import { IPayslip, IEarning, IBonus, IPreapprovedBonus, INote } from '../../../../../models/interfaces/IPayslip.interface';
import { PayslipService } from '../../../../../services/payslip-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { MatDialog } from '@angular/material/dialog';
import { SubmitQueryDialogComponent } from '../submit-query-dialog/submit-query-dialog';
import { environment } from '../../../../../../environments/environment';
import { PayPeriodPipe } from '../../../../../pipes/pay-period-pipe';
import { PayslipStatusPipe } from '../../../../../pipes/payslip-status.pipe';
import { AuthService } from '../../../../../services/auth-service';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { IUser } from '../../../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-payslip-viewer',
  standalone: true,
  templateUrl: './payslip-viewer.html',
  styleUrls: ['./payslip-viewer.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
    MatDividerModule,
    MatTooltipModule,
    MatSelectModule,
    MatOptionModule,
    PayPeriodPipe,
    PayslipStatusPipe
  ]
})
export class PayslipViewer implements OnInit {
  private route = inject(ActivatedRoute);
  private payslipService = inject(PayslipService);
  private snackbarService = inject(SnackBarService);
  public dialog = inject(MatDialog);
  private authService = inject(AuthService);

  // Use a BehaviorSubject to easily refresh data
  private payslipDataSubject = new BehaviorSubject<{payslip: IPayslip} | null>(null);
  public payslipData$ = this.payslipDataSubject.asObservable();

  public earningsDisplayedColumns: string[] = ['date', 'description', 'baseRate', 'hours', 'rate', 'total'];
  public deductionsDisplayedColumns: string[] = ['description', 'amount'];
  public EPayslipStatus = EPayslipStatus;
  public environment = environment;
  public currentUser$ = this.authService.currentUser$;

  // Selected bonus for adding
  public selectedBonusId = '';

  // Editing state for deductions
  public editingDeduction: number | null = null;
  public editingDeductionData: { description: string; amount: number } = { description: '', amount: 0 };

  // Editing state for misc earnings
  public editingMiscEarning: number | null = null;
  public editingMiscEarningData: { description: string; amount: number } = { description: '', amount: 0 };

  // Preapproved bonus items
  private preapprovedBonuses: IPreapprovedBonus[] = [
    { id: 'performance', description: 'Performance Bonus - High Student Ratings', amount: 500, category: 'Performance' },
    { id: 'referral', description: 'Referral Bonus - New Student', amount: 200, category: 'Referral' },
    { id: 'weekend', description: 'Weekend Extra Hours Bonus', amount: 300, category: 'Overtime' },
    { id: 'completion', description: 'Completion Bonus - Advanced Course', amount: 400, category: 'Achievement' },
    { id: 'punctuality', description: 'Perfect Attendance Bonus', amount: 250, category: 'Performance' },
    { id: 'excellence', description: 'Teaching Excellence Award', amount: 750, category: 'Achievement' },
    { id: 'innovation', description: 'Innovation in Teaching Methods', amount: 350, category: 'Achievement' }
  ];

  public ngOnInit(): void {
    this.loadPayslipData();
  }

  /**
   * Fetches and processes payslip data from the services.
   */
  public loadPayslipData(): void {
    const payslip$ = this.route.paramMap.pipe(
      switchMap(params => {
        const id = params.get('id');
        if (!id) {
          throw new Error('No payslip ID provided in the route.');
        }
        return this.payslipService.getPayslipById(id);
      })
    );

    const preapprovedItems$ = this.payslipService.getPreapprovedItems();

    combineLatest([payslip$, preapprovedItems$]).pipe(
      map(([payslip, _preapprovedItems]) => {
        // For the new payslip structure, we don't need to split earnings
        // as we have separate arrays for each type
        return { payslip };
      })
    ).subscribe(data => this.payslipDataSubject.next(data));
  }

  /**
   * Submits the payslip for approval by updating its status.
   */
  public submitForApproval(payslip: IPayslip): void {
    this.payslipService.updatePayslipStatus(payslip._id, EPayslipStatus.STAFF_APPROVED).pipe(
      tap(() => {
        this.snackbarService.showSuccess('Payslip submitted for approval.');
        this.loadPayslipData(); // Refresh data
      })
    ).subscribe();
  }

  /**
   * Opens the dialog for submitting a query on a specific line item.
   */
  public openQueryDialog(lineItem: IEarning | IBonus | {description: string; amount: number} | null, itemType: 'earning' | 'bonus' | 'deduction' | 'general', itemIndex?: number): void {
    const currentPayslipData = this.payslipDataSubject.value;
    if (!currentPayslipData) return;

    // Check if there's an existing query for this item
    const existingQuery = this.getQueryDetails(lineItem?.description || '', itemType, itemIndex);

    const dialogRef = this.dialog.open(SubmitQueryDialogComponent, {
      width: '600px',
      data: {
        payslip: currentPayslipData.payslip,
        selectedItem: lineItem,
        itemType: itemType,
        itemIndex: itemIndex,
        existingQuery: existingQuery
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadPayslipData(); // Refresh if a query was made
      }
    });
  }

  /**
   * Opens the dialog for submitting a query (legacy method for the general button).
   */
  public addQuery(payslip: IPayslip): void {
    const dialogRef = this.dialog.open(SubmitQueryDialogComponent, {
        width: '500px',
        data: { payslip }
    });

    dialogRef.afterClosed().subscribe(result => {
        if (result) {
            this.loadPayslipData(); // Refresh if a query was made
        }
    });
  }

  /**
   * Adds dummy test data to the current payslip (development only).
   */
  public addDummyData(): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    const earnings = this.getDummyEarnings();
    const bonuses = this.getDummyBonuses();
    const miscEarnings = this.getDummyMiscEarnings();
    const deductions = this.getDummyDeductions();

    const grossEarnings = earnings.reduce((total, earning) => total + earning.total, 0);
    const totalBonuses = this.getTotalBonuses(bonuses);
    const totalMiscEarnings = this.getTotalMiscEarnings(miscEarnings);
    const totalDeductions = deductions.reduce((total, deduction) => total + deduction.amount, 0);
    const paye = Math.round((grossEarnings + totalBonuses + totalMiscEarnings) * 0.15); // 15% PAYE estimate
    const uif = Math.round((grossEarnings + totalBonuses + totalMiscEarnings) * 0.01);  // 1% UIF estimate
    const netPay = grossEarnings + totalBonuses + totalMiscEarnings - totalDeductions - paye - uif;

    const dummyData = {
      ...currentData,
      payslip: {
        ...currentData.payslip,
        earnings: earnings,
        bonuses: bonuses,
        miscEarnings: miscEarnings,
        deductions: deductions,
        grossEarnings: grossEarnings,
        totalDeductions: totalDeductions,
        netPay: netPay,
        paye: paye,
        uif: uif
      }
    };

    this.payslipDataSubject.next(dummyData);
    this.snackbarService.showSuccess('Dummy data added for UI testing!');
  }

  /**
   * Track by function for ngFor performance
   */
  public trackByIndex(index: number): number {
    return index;
  }

  /**
   * Check if an item has an unresolved query
   */
  public hasQuery(itemDescription: string, itemType: string, itemIndex?: number): boolean {
    const currentData = this.payslipDataSubject.value;
    if (!currentData?.payslip?.notes) return false;

    // Create the same itemId format as used in the query dialog
    const itemId = itemIndex !== undefined ? `${itemType}-${itemIndex}` : itemDescription;

    return currentData.payslip.notes.some((note: {itemId: string; resolved: boolean}) =>
      note.itemId === itemId && !note.resolved
    );
  }

  /**
   * Get unresolved query details for an item
   */
  public getQueryDetails(itemDescription: string, itemType: string, itemIndex?: number): INote | undefined {
    const currentData = this.payslipDataSubject.value;
    if (!currentData?.payslip?.notes) return undefined;

    const itemId = itemIndex !== undefined ? `${itemType}-${itemIndex}` : itemDescription;

    return currentData.payslip.notes.find((note: INote) =>
      note.itemId === itemId && !note.resolved
    );
  }

  /**
   * Get current date for display
   */
  public getCurrentDate(): Date {
    return new Date();
  }

  /**
   * Get current user synchronously
   */
  private getCurrentUser(): IUser | null {
    let currentUser: IUser | null = null;
    this.authService.currentUser$.pipe(take(1)).subscribe(user => {
      currentUser = user;
    });
    return currentUser;
  }

  /**
   * Get current user name
   */
  public getCurrentUserName(): string {
    const user = this.getCurrentUser();
    return user?.displayName || 'Unknown User';
  }

  /**
   * Get current user email
   */
  public getCurrentUserEmail(): string {
    const user = this.getCurrentUser();
    return user?.email || 'unknown@tutorcore.com';
  }

  /**
   * Check if current user is admin
   */
  public isCurrentUserAdmin(): boolean {
    const user = this.getCurrentUser();
    return user?.type === EUserType.Admin;
  }

  /**
   * Check if the payslip can be edited
   */
  public canEditPayslip(payslip: IPayslip): boolean {
    return payslip.status === EPayslipStatus.DRAFT;
  }

  /**
   * Get dummy earnings data matching database structure
   */
  public getDummyEarnings(): IEarning[] {
    return [
      {
        description: 'Individual Tutoring - Mathematics',
        baseRate: 50,
        hours: 2,
        rate: 150,
        total: 50 + (2 * 150),
        date: '2024-09-15'
      },
      {
        description: 'Group Session - Physical Sciences',
        baseRate: 100,
        hours: 1.5,
        rate: 200,
        total: 100 + (1.5 * 200),
        date: '2024-09-16'
      },
      {
        description: 'Online Tutoring - English',
        baseRate: 30,
        hours: 3,
        rate: 120,
        total: 30 + (3 * 120),
        date: '2024-09-17'
      },
      {
        description: 'Weekend Workshop - Chemistry',
        baseRate: 200,
        hours: 4,
        rate: 180,
        total: 200 + (4 * 180),
        date: '2024-09-21'
      }
    ];
  }

  /**
   * Get dummy bonuses data matching database structure
   */
  public getDummyBonuses(): IBonus[] {
    return [
      { description: 'Performance Bonus - High Student Ratings', amount: 500 },
      { description: 'Referral Bonus - New Student', amount: 200 },
      { description: 'Completion Bonus - Advanced Course', amount: 400 }
    ];
  }

  /**
   * Get available preapproved bonus items for dropdown
   */
  public getAvailableBonuses(): IPreapprovedBonus[] {
    return this.preapprovedBonuses;
  }

  /**
   * Add the selected bonus to the current payslip
   */
  public addSelectedBonus(): void {
    if (!this.selectedBonusId) {
      this.snackbarService.showError('Please select a bonus to add');
      return;
    }

    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    const preapprovedBonus = this.preapprovedBonuses.find(b => b.id === this.selectedBonusId);
    if (!preapprovedBonus) return;

    const newBonus: IBonus = {
      description: preapprovedBonus.description,
      amount: preapprovedBonus.amount
    };

    // Save to database
    this.payslipService.addBonus(currentData.payslip._id, newBonus).pipe(
      tap((updatedPayslip: IPayslip) => {

        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.snackbarService.showSuccess(`Added bonus: ${preapprovedBonus.description}`);

        // Reset selection
        this.selectedBonusId = '';
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to add bonus. Please try again.');
      }
    });
  }

  /**
   * Remove a bonus from the current payslip
   */
  public removeBonus(index: number): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData || !currentData.payslip.bonuses) return;

    // Save to database
    this.payslipService.removeBonus(currentData.payslip._id, index).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.snackbarService.showSuccess('Bonus removed successfully');
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to remove bonus. Please try again.');
      }
    });
  }

  /**
   * Get dummy misc earnings data matching database structure
   */
  public getDummyMiscEarnings(): {description: string; amount: number}[] {
    return [
      { description: 'Overtime Bonus', amount: 250 },
      { description: 'Holiday Pay', amount: 500 }
    ];
  }

  /**
   * Get dummy deductions data matching database structure
   */
  public getDummyDeductions(): {description: string; amount: number}[] {
    return [
      { description: 'Equipment Usage Fee', amount: 150 },
      { description: 'Platform Commission', amount: 375 },
      { description: 'Training Materials', amount: 125 },
      { description: 'Administrative Fee', amount: 200 }
    ];
  }

  /**
   * Calculate total bonuses
   */
  public getTotalBonuses(bonuses: IBonus[]): number {
    return bonuses?.reduce((total, bonus) => total + bonus.amount, 0) || 0;
  }

  /**
   * Calculate total for a single earning entry (hours * rate)
   */
  public calculateEarningTotal(hours: number, rate: number): number {
    return (hours || 0) * (rate || 0);
  }

  /**
   * Calculate gross earnings from earnings array
   */
  public calculateGrossEarnings(earnings: IEarning[]): number {
    return earnings?.reduce((total, earning) => total + (earning.total || this.calculateEarningTotal(earning.hours, earning.rate)), 0) || 0;
  }

  /**
   * Calculate net pay (gross earnings + bonuses - deductions - taxes)
   */
  public calculateNetPay(grossEarnings: number, bonuses: IBonus[], totalDeductions: number, paye?: number, uif?: number): number {
    const totalBonuses = this.getTotalBonuses(bonuses);
    const totalTaxes = (paye || 0) + (uif || 0);
    return grossEarnings + totalBonuses - totalDeductions - totalTaxes;
  }

  /**
   * Recalculate and update net pay for current payslip data
   */
  private recalculateNetPay(payslipData: IPayslip): number {
    const grossEarnings = payslipData.grossEarnings || 0;
    const totalBonuses = this.getTotalBonuses(payslipData.bonuses || []);
    const totalMiscEarnings = this.getTotalMiscEarnings(payslipData.miscEarnings || []);
    const totalDeductions = payslipData.totalDeductions || 0;
    const paye = payslipData.paye || 0;
    const uif = payslipData.uif || 0;
    return grossEarnings + totalBonuses + totalMiscEarnings - totalDeductions - paye - uif;
  }

  /**
   * Calculate total income (gross earnings + bonuses)
   */
  public getTotalIncome(payslipData: IPayslip): number {
    const grossEarnings = payslipData?.grossEarnings || 0;
    const totalBonuses = this.getTotalBonuses(payslipData?.bonuses || []);
    const totalMiscEarnings = this.getTotalMiscEarnings(payslipData?.miscEarnings || []);
    return grossEarnings + totalBonuses + totalMiscEarnings;
  }

  /**
   * Get current net pay (calculated dynamically)
   */
  public getCurrentNetPay(payslipData: IPayslip): number {
    return this.recalculateNetPay(payslipData);
  }

  /**
   * Generate and download professional PDF payslip
   */
  public downloadPDF(payslip: IPayslip): void {
    import('jspdf').then(({ jsPDF }) => {
      const doc = new jsPDF('portrait', 'mm', 'a4');

      // Company Header
      doc.setFontSize(20);
      doc.setFont('helvetica', 'bold');
      doc.text('TUTORCORE', 20, 25);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('TutorCore (Pty) Ltd', 20, 35);
      doc.text('Registration Number: 2024/123456/07', 20, 40);
      doc.text('123 Education Drive, Sandton, Johannesburg', 20, 45);
      doc.text('2196, South Africa', 20, 50);
      doc.text('www.tutorcore.com', 20, 55);

      // Payslip Title
      doc.setFontSize(16);
      doc.setFont('helvetica', 'bold');
      doc.text('PAYSLIP', 160, 25);

      // Employee Info
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee: ${this.getCurrentUserName()}`, 160, 35);
      doc.text(`Email: ${this.getCurrentUserEmail()}`, 160, 40);
      doc.text(`Period: ${payslip.payPeriod || 'Current Month'}`, 160, 50);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 160, 55);

      // Line separator
      doc.line(20, 65, 190, 65);

      let yPosition = 80;

      // Earnings Section
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('EARNINGS', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Description', 20, yPosition);
      doc.text('Hours', 120, yPosition);
      doc.text('Rate', 140, yPosition);
      doc.text('Total', 170, yPosition);
      yPosition += 5;

      doc.line(20, yPosition, 190, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'normal');
      const earnings = payslip.earnings || this.getDummyEarnings();
      earnings.forEach(earning => {
        // Check if we need a new page before adding content
        if (yPosition > 270) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(earning.description, 20, yPosition);
        doc.text(earning.hours?.toString() || '0', 120, yPosition);
        doc.text(`R${earning.rate?.toFixed(2) || '0.00'}`, 140, yPosition);
        doc.text(`R${earning.total?.toFixed(2) || '0.00'}`, 170, yPosition);
        yPosition += 5;
      });

      yPosition += 5;
      doc.line(140, yPosition, 190, yPosition);
      yPosition += 5;

      doc.setFont('helvetica', 'bold');
      doc.text('Gross Earnings:', 120, yPosition);
      doc.text(`R${payslip.grossEarnings?.toFixed(2) || '0.00'}`, 170, yPosition);
      yPosition += 15;

      // Bonuses Section
      if (payslip.bonuses && payslip.bonuses.length > 0) {
        doc.setFontSize(12);
        doc.text('BONUSES', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(9);
        doc.text('Description', 20, yPosition);
        doc.text('Amount', 170, yPosition);
        yPosition += 5;

        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        payslip.bonuses.forEach(bonus => {
          // Check if we need a new page before adding content
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(bonus.description, 20, yPosition);
          doc.text(`R${bonus.amount?.toFixed(2) || '0.00'}`, 170, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
        doc.line(140, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'bold');
        const totalBonuses = this.getTotalBonuses(payslip.bonuses);
        doc.text('Total Bonuses:', 120, yPosition);
        doc.text(`R${totalBonuses.toFixed(2)}`, 170, yPosition);
        yPosition += 15;
      }

      // Misc Earnings Section
      if (payslip.miscEarnings && payslip.miscEarnings.length > 0) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('MISC EARNINGS', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(9);
        doc.text('Description', 20, yPosition);
        doc.text('Amount', 170, yPosition);
        yPosition += 5;

        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        payslip.miscEarnings.forEach(miscEarning => {
          // Check if we need a new page before adding content
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(miscEarning.description, 20, yPosition);
          doc.text(`R${miscEarning.amount?.toFixed(2) || '0.00'}`, 170, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
        doc.line(140, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Total Misc Earnings:', 120, yPosition);
        doc.text(`R${(payslip.miscEarnings?.reduce((total, earning) => total + earning.amount, 0) || 0).toFixed(2) || '0.00'}`, 170, yPosition);
        yPosition += 15;
      }

      // Deductions Section
      if (payslip.deductions && payslip.deductions.length > 0) {
        doc.setFontSize(12);
        doc.text('DEDUCTIONS', 20, yPosition);
        yPosition += 10;

        doc.setFontSize(9);
        doc.text('Description', 20, yPosition);
        doc.text('Amount', 170, yPosition);
        yPosition += 5;

        doc.line(20, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'normal');
        payslip.deductions.forEach(deduction => {
          // Check if we need a new page before adding content
          if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
          }
          doc.text(deduction.description, 20, yPosition);
          doc.text(`R${deduction.amount?.toFixed(2) || '0.00'}`, 170, yPosition);
          yPosition += 5;
        });

        yPosition += 5;
        doc.line(140, yPosition, 190, yPosition);
        yPosition += 5;

        doc.setFont('helvetica', 'bold');
        doc.text('Total Deductions:', 120, yPosition);
        doc.text(`R${payslip.totalDeductions?.toFixed(2) || '0.00'}`, 170, yPosition);
        yPosition += 15;
      }

      // Tax Information (add extra spacing)
      yPosition += 10; // Add extra space before tax information

      // Check if we need a new page for tax information
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('TAX INFORMATION', 20, yPosition);
      yPosition += 10;

      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      doc.text('PAYE:', 20, yPosition);
      doc.text(`R${payslip.paye?.toFixed(2) || '0.00'}`, 170, yPosition);
      yPosition += 5;

      doc.text('UIF:', 20, yPosition);
      doc.text(`R${payslip.uif?.toFixed(2) || '0.00'}`, 170, yPosition);
      yPosition += 20; // Increased spacing before Net Pay

      // Check if we need a new page
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }

      // Net Pay (highlighted) - use dynamic calculation
      const dynamicNetPay = this.getCurrentNetPay(payslip);
      doc.setDrawColor(0, 0, 0);
      doc.setFillColor(240, 240, 240);
      doc.rect(20, yPosition - 5, 170, 10, 'F');

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('NET PAY:', 25, yPosition + 2);
      doc.text(`R${dynamicNetPay.toFixed(2)}`, 150, yPosition + 2);

      // Footer - position based on content
      yPosition += 30;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text('This payslip is generated electronically and does not require a signature.', 20, yPosition);
      doc.text(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 20, yPosition + 5);

      // Save the PDF
      const userName = this.getCurrentUserName().replace(/\s+/g, '_');
      const fileName = `Payslip_${userName}_${payslip.payPeriod || new Date().getMonth() + 1}_${new Date().getFullYear()}.pdf`;
      doc.save(fileName);

      this.snackbarService.showSuccess('PDF downloaded successfully!');
    }).catch(() => {
      this.snackbarService.showError('Error generating PDF. Please try again.');
    });
  }

  // ===== DEDUCTION MANAGEMENT METHODS =====

  /**
   * Add a new deduction to the payslip
   */
  public addNewDeduction(): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    const newDeduction = {
      description: 'New Deduction',
      amount: 0
    };

    // Save to backend
    this.payslipService.addDeduction(currentData.payslip._id, newDeduction).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);

        // Start editing the new deduction (last index)
        const newIndex = updatedPayslip.deductions.length - 1;
        this.editDeduction(newIndex, updatedPayslip.deductions[newIndex]);
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to add deduction. Please try again.');
      }
    });
  }

  /**
   * Edit a deduction
   */
  public editDeduction(index: number, deduction: {description: string; amount: number}): void {
    this.editingDeduction = index;
    this.editingDeductionData = { ...deduction };
  }

  /**
   * Save deduction edit
   */
  public saveDeductionEdit(index: number): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData || this.editingDeduction === null) return;

    // Save to backend
    this.payslipService.updateDeduction(currentData.payslip._id, index, this.editingDeductionData).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.cancelDeductionEdit();
        this.snackbarService.showSuccess('Deduction updated successfully');
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to update deduction. Please try again.');
      }
    });
  }

  /**
   * Cancel deduction edit
   */
  public cancelDeductionEdit(): void {
    this.editingDeduction = null;
    this.editingDeductionData = { description: '', amount: 0 };
  }

  /**
   * Remove a deduction
   */
  public removeDeduction(index: number): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    // Save to backend
    this.payslipService.removeDeduction(currentData.payslip._id, index).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.snackbarService.showSuccess('Deduction removed successfully');
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to remove deduction. Please try again.');
      }
    });
  }

  // ===== MISC EARNINGS MANAGEMENT METHODS =====

  /**
   * Add a new misc earning to the payslip
   */
  public addNewMiscEarning(): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    const newEarning = {
      description: 'New Misc Earning',
      amount: 0
    };

    // Save to backend
    this.payslipService.addMiscEarning(currentData.payslip._id, newEarning).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);

        // Start editing the new earning (last index)
        const newIndex = (updatedPayslip.miscEarnings || []).length - 1;
        this.editMiscEarning(newIndex, updatedPayslip.miscEarnings![newIndex]);
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to add misc earning. Please try again.');
      }
    });
  }

  /**
   * Edit a misc earning
   */
  public editMiscEarning(index: number, earning: {description: string; amount: number}): void {
    this.editingMiscEarning = index;
    this.editingMiscEarningData = { ...earning };
  }

  /**
   * Save misc earning edit
   */
  public saveMiscEarningEdit(index: number): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData || this.editingMiscEarning === null) return;

    // Save to backend
    this.payslipService.updateMiscEarning(currentData.payslip._id, index, this.editingMiscEarningData).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.cancelMiscEarningEdit();
        this.snackbarService.showSuccess('Misc earning updated successfully');
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to update misc earning. Please try again.');
      }
    });
  }

  /**
   * Cancel misc earning edit
   */
  public cancelMiscEarningEdit(): void {
    this.editingMiscEarning = null;
    this.editingMiscEarningData = { description: '', amount: 0 };
  }

  /**
   * Handle keydown events to prevent entering more than 2 decimal places
   */
  public onAmountKeydown(event: KeyboardEvent, _type: 'miscEarning' | 'deduction'): void {
    const input = event.target as HTMLInputElement;
    const value = input.value;

    // Allow navigation and control keys
    const allowedKeys = [
      'Backspace', 'Delete', 'Tab', 'Escape', 'Enter',
      'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
      'Home', 'End'
    ];

    if (allowedKeys.includes(event.key)) {
      return;
    }

    // Allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z
    if (event.ctrlKey && ['a', 'c', 'v', 'x', 'z'].includes(event.key.toLowerCase())) {
      return;
    }

    // Allow numbers and decimal point
    if (!/[0-9.]/.test(event.key)) {
      event.preventDefault();
      return;
    }

    // Prevent multiple decimal points
    if (event.key === '.' && value.includes('.')) {
      event.preventDefault();
      return;
    }

    // Prevent more than 2 decimal places
    if (value.includes('.')) {
      const parts = value.split('.');
      const decimalPart = parts[1];
      const selectionStart = input.selectionStart || 0;
      const selectionEnd = input.selectionEnd || 0;

      // If we're typing after the decimal point and already have 2 digits
      if (decimalPart && decimalPart.length >= 2) {
        // Allow if we're replacing selected text or typing before the decimal
        if (selectionStart === selectionEnd && selectionStart > value.indexOf('.') + 2) {
          event.preventDefault();
          return;
        }
      }
    }
  }

  /**
   * Handle amount input to clean up any formatting issues
   */
  public onAmountInput(event: Event, type: 'miscEarning' | 'deduction'): void {
    const target = event.target as HTMLInputElement;
    const value = target.value;

    if (value && value.includes('.')) {
      const parts = value.split('.');
      if (parts[1] && parts[1].length > 2) {
        // Truncate to 2 decimal places
        const limitedValue = parts[0] + '.' + parts[1].substring(0, 2);
        const parsedValue = parseFloat(limitedValue);

        if (type === 'miscEarning') {
          this.editingMiscEarningData.amount = parsedValue;
        } else if (type === 'deduction') {
          this.editingDeductionData.amount = parsedValue;
        }

        // Update the input field
        target.value = limitedValue;
      }
    }
  }

  /**
   * Remove a misc earning
   */
  public removeMiscEarning(index: number): void {
    const currentData = this.payslipDataSubject.value;
    if (!currentData) return;

    // Save to backend
    this.payslipService.removeMiscEarning(currentData.payslip._id, index).pipe(
      tap((updatedPayslip: IPayslip) => {
        const updatedData = {
          ...currentData,
          payslip: updatedPayslip
        };
        this.payslipDataSubject.next(updatedData);
        this.snackbarService.showSuccess('Misc earning removed successfully');
      })
    ).subscribe({
      error: () => {
        this.snackbarService.showError('Failed to remove misc earning. Please try again.');
      }
    });
  }

  /**
   * Calculate total misc earnings
   */
  public getTotalMiscEarnings(miscEarnings: {amount: number}[]): number {
    return miscEarnings?.reduce((total, earning) => total + earning.amount, 0) || 0;
  }
}
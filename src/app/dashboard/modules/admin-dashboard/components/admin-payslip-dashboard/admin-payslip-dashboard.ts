import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatOptionModule } from '@angular/material/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BehaviorSubject, combineLatest, map, Observable, startWith, switchMap } from 'rxjs';
import { IPayslip } from '../../../../../models/interfaces/IPayslip.interface';
import { PayslipService } from '../../../../../services/payslip-service';
import { EPayslipStatus } from '../../../../../models/enums/payslip-status.enum';
import { PayPeriodPipe } from '../../../../../pipes/pay-period-pipe';
import { PayslipStatusPipe } from '../../../../../pipes/payslip-status.pipe';
import { FormControl } from '@angular/forms';
import { UserService } from '../../../../../services/user-service';

interface PayslipWithUser extends IPayslip {
  userDisplay?: string;
}

@Component({
  selector: 'app-admin-payslip-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatTooltipModule,
    PayPeriodPipe,
    PayslipStatusPipe
  ],
  templateUrl: './admin-payslip-dashboard.html',
  styleUrls: ['./admin-payslip-dashboard.scss']
})
export class AdminPayslipDashboard implements OnInit {
  private payslipService = inject(PayslipService);
  private userService = inject(UserService);
  private router = inject(Router);

  private refreshSubject = new BehaviorSubject<void>(undefined);
  public payslips$!: Observable<PayslipWithUser[]>;
  public displayedColumns: string[] = ['user', 'payPeriod', 'status', 'netPay', 'actions'];

  // Filter controls
  public userSearchControl = new FormControl('');
  public statusFilter = new FormControl('');
  public payPeriodFilter = new FormControl('');

  // Status options for the dropdown
  public statusOptions = [
    { value: '', label: 'All Statuses' },
    { value: EPayslipStatus.DRAFT, label: 'Draft' },
    { value: EPayslipStatus.QUERY, label: 'Query' },
    { value: EPayslipStatus.QUERY_HANDLED, label: 'Query Handled' },
    { value: EPayslipStatus.STAFF_APPROVED, label: 'Staff Approved' },
    { value: EPayslipStatus.LOCKED, label: 'Locked' },
    { value: EPayslipStatus.PAID, label: 'Paid' }
  ];

  // Available users for autocomplete
  public filteredUsers$!: Observable<{ _id: string; displayName: string; email: string }[]>;
  public users: { _id: string; displayName: string; email: string }[] = [];

  public ngOnInit(): void {
    this.loadData();
  }

  private loadData(): void {
    // Fetch users initially if needed
    this.userService.fetchAllUsers().subscribe();

    // Set up filtered users for autocomplete
    this.filteredUsers$ = this.userSearchControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterUsers(value))
    );

    // Combine all filter changes to reload payslips
    // Include allUsers$ to ensure users are loaded before mapping payslips
    this.payslips$ = combineLatest([
      this.refreshSubject,
      this.userSearchControl.valueChanges.pipe(startWith('')),
      this.statusFilter.valueChanges.pipe(startWith('')),
      this.payPeriodFilter.valueChanges.pipe(startWith('')),
      this.userService.allUsers$ // Wait for users to load
    ]).pipe(
      switchMap(([_, userSearch, status, payPeriod, users]) => {
        this.users = users; // Update users array
        const filters: { userId?: string; status?: string; payPeriod?: string } = {};

        // Find userId from user search
        // userSearch can be a string (typed) or user object (selected)
        if (userSearch) {
          if (typeof userSearch === 'object' && userSearch !== null && 'displayName' in userSearch) {
            // User object was selected from autocomplete
            filters.userId = (userSearch as { _id: string })._id;
          } else if (typeof userSearch === 'string') {
            // String was typed - try to find matching user
            const matchedUser = users.find(u =>
              u.displayName?.toLowerCase().includes(userSearch.toLowerCase()) ||
              u.email?.toLowerCase().includes(userSearch.toLowerCase())
            );
            if (matchedUser) {
              filters.userId = matchedUser._id;
            }
          }
        }

        if (status) filters.status = status;
        if (payPeriod) filters.payPeriod = payPeriod;

        return this.payslipService.getAllPayslips(filters).pipe(
          map(payslips => ({ payslips, users })) // Pass users along
        );
      }),
      map(({ payslips, users }) => {
        // Add user display names to payslips
        return payslips.map(payslip => {
          const user = users.find(u => u._id === (payslip.userId as unknown as {_id: string})._id);
          return {
            ...payslip,
            userDisplay: user ? `${user.displayName} (${user.email})` : 'Unknown User'
          };
        });
      })
    );
  }

  private _filterUsers(value: string | { _id: string; displayName: string; email: string } | null): { _id: string; displayName: string; email: string }[] {
    // Handle both string (typed) and object (selected) values
    if (!value) return this.users;

    // If value is an object (user was selected), show all users
    if (typeof value === 'object') {
      return this.users;
    }

    // If value is a string, filter users
    const filterValue = value.toLowerCase();
    return this.users.filter(user =>
      user.displayName?.toLowerCase().includes(filterValue) ||
      user.email?.toLowerCase().includes(filterValue)
    );
  }

  public displayUserFn(user: { displayName: string; email: string } | null | undefined): string {
    return user ? `${user.displayName} (${user.email})` : '';
  }

  public viewPayslip(payslip: IPayslip): void {
    this.router.navigate(['/dashboard/admin/payslips', payslip._id]);
  }

  public clearFilters(): void {
    this.userSearchControl.setValue('');
    this.statusFilter.setValue('');
    this.payPeriodFilter.setValue('');
  }

  public refresh(): void {
    this.refreshSubject.next();
  }

  public getStatusClass(status: EPayslipStatus): string {
    return status;
  }
}

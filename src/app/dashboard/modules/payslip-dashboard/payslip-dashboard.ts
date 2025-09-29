import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayslipHistory } from './payslip-history/payslip-history';

@Component({
  selector: 'app-payslip-dashboard',
  standalone: true,
  imports: [CommonModule, PayslipHistory],
  templateUrl: './payslip-dashboard.html',
  styleUrls: ['./payslip-dashboard.scss']
})
export class PayslipDashboard {

}
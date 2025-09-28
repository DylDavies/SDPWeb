import { Pipe, PipeTransform } from '@angular/core';
import { EPayslipStatus } from '../models/enums/payslip-status.enum';

@Pipe({
  name: 'payslipStatus',
  standalone: true
})
export class PayslipStatusPipe implements PipeTransform {
  transform(status: EPayslipStatus): string {
    switch (status) {
      case EPayslipStatus.DRAFT:
        return 'Draft';
      case EPayslipStatus.QUERY:
        return 'Query';
      case EPayslipStatus.QUERY_HANDLED:
        return 'Query Handled';
      case EPayslipStatus.STAFF_APPROVED:
        return 'Staff Approved';
      case EPayslipStatus.LOCKED:
        return 'Locked';
      case EPayslipStatus.PAID:
        return 'Paid';
      default:
        return status;
    }
  }
}
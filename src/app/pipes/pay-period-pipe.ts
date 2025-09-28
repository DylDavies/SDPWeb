import { Pipe, PipeTransform } from '@angular/core';
import { DatePipe } from '@angular/common';

@Pipe({
  name: 'payPeriod',
  standalone: true,
})
export class PayPeriodPipe implements PipeTransform {

  /**
   * Transforms a 'YYYY-MM' string into 'MMMM yyyy'.
   * @param value The date string to transform.
   * @returns The formatted date string.
   */
  transform(value: string | undefined | null): string {
    if (!value) {
      return '';
    }

    try {
      const [year, month] = value.split('-');

      // Validate input format
      if (!year || !month || year.length !== 4 || month.length < 1 || month.length > 2) {
        console.error('Invalid date format for payPeriod pipe:', value);
        return value;
      }

      const yearNum = Number(year);
      const monthNum = Number(month);

      // Validate numeric values and month range (allow 0 for December of previous year)
      if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 0 || monthNum > 12) {
        console.error('Invalid date format for payPeriod pipe:', value);
        return value;
      }

      const date = new Date(yearNum, monthNum - 1);
      return new DatePipe('en-US').transform(date, 'MMMM yyyy') || '';
    } catch {
      console.error('Invalid date format for payPeriod pipe:', value);
      return value; // Return original value if format is unexpected
    }
  }

}
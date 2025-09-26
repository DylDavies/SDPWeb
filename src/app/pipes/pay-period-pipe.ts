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
      const date = new Date(Number(year), Number(month) - 1);
      return new DatePipe('en-US').transform(date, 'MMMM yyyy') || '';
    } catch {
      console.error('Invalid date format for payPeriod pipe:', value);
      return value; // Return original value if format is unexpected
    }
  }

}
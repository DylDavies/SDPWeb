import { PayslipStatusPipe } from './payslip-status.pipe';
import { EPayslipStatus } from '../models/enums/payslip-status.enum';

describe('PayslipStatusPipe', () => {
  let pipe: PayslipStatusPipe;

  beforeEach(() => {
    pipe = new PayslipStatusPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform DRAFT status correctly', () => {
    const result = pipe.transform(EPayslipStatus.DRAFT);
    expect(result).toBe('Draft');
  });

  it('should transform QUERY status correctly', () => {
    const result = pipe.transform(EPayslipStatus.QUERY);
    expect(result).toBe('Query');
  });

  it('should transform QUERY_HANDLED status correctly', () => {
    const result = pipe.transform(EPayslipStatus.QUERY_HANDLED);
    expect(result).toBe('Query Handled');
  });

  it('should transform STAFF_APPROVED status correctly', () => {
    const result = pipe.transform(EPayslipStatus.STAFF_APPROVED);
    expect(result).toBe('Staff Approved');
  });

  it('should transform LOCKED status correctly', () => {
    const result = pipe.transform(EPayslipStatus.LOCKED);
    expect(result).toBe('Locked');
  });

  it('should transform PAID status correctly', () => {
    const result = pipe.transform(EPayslipStatus.PAID);
    expect(result).toBe('Paid');
  });

  it('should return original status for unknown status', () => {
    const unknownStatus = 'UNKNOWN_STATUS' as EPayslipStatus;
    const result = pipe.transform(unknownStatus);
    expect(result).toBe('UNKNOWN_STATUS');
  });

  it('should handle all defined enum values', () => {
    // Test that all enum values are properly handled
    const statusMap = {
      [EPayslipStatus.DRAFT]: 'Draft',
      [EPayslipStatus.QUERY]: 'Query',
      [EPayslipStatus.QUERY_HANDLED]: 'Query Handled',
      [EPayslipStatus.STAFF_APPROVED]: 'Staff Approved',
      [EPayslipStatus.LOCKED]: 'Locked',
      [EPayslipStatus.PAID]: 'Paid'
    };

    Object.entries(statusMap).forEach(([status, expected]) => {
      const result = pipe.transform(status as EPayslipStatus);
      expect(result).toBe(expected);
    });
  });
});
import { PayPeriodPipe } from './pay-period-pipe';

describe('PayPeriodPipe', () => {
  let pipe: PayPeriodPipe;

  beforeEach(() => {
    pipe = new PayPeriodPipe();
  });

  it('should create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform YYYY-MM format to MMMM yyyy format', () => {
    const result = pipe.transform('2024-09');
    expect(result).toBe('September 2024');
  });

  it('should transform different months correctly', () => {
    expect(pipe.transform('2024-01')).toBe('January 2024');
    expect(pipe.transform('2024-02')).toBe('February 2024');
    expect(pipe.transform('2024-03')).toBe('March 2024');
    expect(pipe.transform('2024-04')).toBe('April 2024');
    expect(pipe.transform('2024-05')).toBe('May 2024');
    expect(pipe.transform('2024-06')).toBe('June 2024');
    expect(pipe.transform('2024-07')).toBe('July 2024');
    expect(pipe.transform('2024-08')).toBe('August 2024');
    expect(pipe.transform('2024-09')).toBe('September 2024');
    expect(pipe.transform('2024-10')).toBe('October 2024');
    expect(pipe.transform('2024-11')).toBe('November 2024');
    expect(pipe.transform('2024-12')).toBe('December 2024');
  });

  it('should handle different years correctly', () => {
    expect(pipe.transform('2023-06')).toBe('June 2023');
    expect(pipe.transform('2025-12')).toBe('December 2025');
  });

  it('should return empty string for null input', () => {
    const result = pipe.transform(null);
    expect(result).toBe('');
  });

  it('should return empty string for undefined input', () => {
    const result = pipe.transform(undefined);
    expect(result).toBe('');
  });

  it('should return empty string for empty string input', () => {
    const result = pipe.transform('');
    expect(result).toBe('');
  });

  it('should handle invalid format gracefully by returning original value', () => {
    spyOn(console, 'error');
    const result = pipe.transform('invalid-format');
    expect(result).toBe('invalid-format');
    expect(console.error).toHaveBeenCalledWith('Invalid date format for payPeriod pipe:', 'invalid-format');
  });

  it('should handle malformed date string gracefully', () => {
    spyOn(console, 'error');
    const result = pipe.transform('2024-13'); // Invalid month
    expect(result).toBe('2024-13');
    expect(console.error).toHaveBeenCalledWith('Invalid date format for payPeriod pipe:', '2024-13');
  });

  it('should handle non-numeric year gracefully', () => {
    spyOn(console, 'error');
    const result = pipe.transform('abc-09');
    expect(result).toBe('abc-09');
    expect(console.error).toHaveBeenCalledWith('Invalid date format for payPeriod pipe:', 'abc-09');
  });

  it('should handle non-numeric month gracefully', () => {
    spyOn(console, 'error');
    const result = pipe.transform('2024-abc');
    expect(result).toBe('2024-abc');
    expect(console.error).toHaveBeenCalledWith('Invalid date format for payPeriod pipe:', '2024-abc');
  });

  it('should handle edge case months', () => {
    // Test month 0 (should be treated as December of previous year)
    expect(pipe.transform('2024-00')).toBe('December 2023');

    // Test single digit months without leading zero
    expect(pipe.transform('2024-1')).toBe('January 2024');
    expect(pipe.transform('2024-9')).toBe('September 2024');
  });
});
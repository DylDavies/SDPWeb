import { UserTypePipe } from './usertype-pipe';
import { EUserType } from '../models/enums/user-type.enum';

describe('UserTypePipe', () => {
  const pipe = new UserTypePipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform "client" to "Client"', () => {
    expect(pipe.transform(EUserType.Client)).toBe('Client');
  });

  it('should transform "staff" to "Staff"', () => {
    expect(pipe.transform(EUserType.Staff)).toBe('Staff');
  });

  it('should transform "admin" to "Administrator"', () => {
    expect(pipe.transform(EUserType.Admin)).toBe('Administrator');
  });

  it('should return an empty string for undefined or unknown values', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('unknown-role' as EUserType)).toBe('');
  });
});
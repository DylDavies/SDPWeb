import { UserRolePipe } from './userrole-pipe';
import { EUserRole } from '../models/enums/user-role.enum';

describe('UserRolePipe', () => {
  const pipe = new UserRolePipe();

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should transform "user" to "Tutor"', () => {
    expect(pipe.transform(EUserRole.User)).toBe('Tutor');
  });

  it('should transform "admin" to "Administrator"', () => {
    expect(pipe.transform(EUserRole.Admin)).toBe('Administrator');
  });

  it('should return an empty string for undefined or unknown values', () => {
    expect(pipe.transform(undefined)).toBe('');
    expect(pipe.transform('unknown-role' as EUserRole)).toBe('');
  });
});
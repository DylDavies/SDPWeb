import { DisplayNamePipe } from './display-name-pipe-pipe';

describe('DisplayNamePipe', () => {
  let pipe: DisplayNamePipe;

  beforeEach(() => {
    pipe = new DisplayNamePipe();
  });

  it('create an instance', () => {
    expect(pipe).toBeTruthy();
  });

  it('should return full string when length is 25 or less', () => {
    const shortName = 'John Doe';
    expect(pipe.transform(shortName)).toBe('John Doe');
  });

  it('should return full string when length is exactly 25', () => {
    const exactName = '1234567890123456789012345'; // exactly 25 chars
    expect(pipe.transform(exactName)).toBe('1234567890123456789012345');
  });

  it('should truncate and add ellipsis when length exceeds 25', () => {
    const longName = 'This is a very long name that exceeds twenty-five characters';
    expect(pipe.transform(longName)).toBe('This is a very long name ...');
  });
});

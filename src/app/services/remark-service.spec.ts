import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RemarkService } from './remark-service';

describe('RemarkService', () => {
  let service: RemarkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(RemarkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
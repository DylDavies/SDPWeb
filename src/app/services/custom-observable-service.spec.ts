import { TestBed } from '@angular/core/testing';

import { CustomObservableService } from './custom-observable-service';

describe('CustomObservableService', () => {
  let service: CustomObservableService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CustomObservableService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

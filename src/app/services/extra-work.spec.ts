import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { ExtraWorkService } from './extra-work';

describe('ExtraWorkService', () => {
  let service: ExtraWorkService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(ExtraWorkService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
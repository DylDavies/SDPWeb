import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BundleService } from './bundle-service';



describe('BundleService', () => {
  let service: BundleService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });
    service = TestBed.inject(BundleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
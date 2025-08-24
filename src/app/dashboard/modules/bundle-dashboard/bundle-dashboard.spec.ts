import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { BundleDashboard } from './bundle-dashboard';

describe('BundleDashboard', () => {
  let component: BundleDashboard;
  let fixture: ComponentFixture<BundleDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BundleDashboard, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BundleDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
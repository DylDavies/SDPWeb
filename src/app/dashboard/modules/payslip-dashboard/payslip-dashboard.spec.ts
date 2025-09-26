import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayslipDashboard } from './payslip-dashboard';

describe('PayslipDashboard', () => {
  let component: PayslipDashboard;
  let fixture: ComponentFixture<PayslipDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayslipDashboard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

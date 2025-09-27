import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PayslipDashboard } from './payslip-dashboard';
import { PayslipService } from '../../../services/payslip-service';
import { UserService } from '../../../services/user-service';
import { AuthService } from '../../../services/auth-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

describe('PayslipDashboard', () => {
  let component: PayslipDashboard;
  let fixture: ComponentFixture<PayslipDashboard>;
  let mockPayslipService: jasmine.SpyObj<PayslipService>;
  let mockUserService: jasmine.SpyObj<UserService>;

  beforeEach(async () => {
    const payslipServiceSpy = jasmine.createSpyObj('PayslipService', [
      'getMyPayslipHistory',
      'getMyCurrentPayslip',
      'generateCurrentPayslip',
      'updatePayslipStatus'
    ]);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['fetchAllUsers']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser$'], {
      currentUser$: of({ _id: 'user1', email: 'test@example.com' })
    });
    const snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', [
      'showSuccess',
      'showError'
    ]);

    await TestBed.configureTestingModule({
      imports: [PayslipDashboard, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: PayslipService, useValue: payslipServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipDashboard);
    component = fixture.componentInstance;

    mockPayslipService = TestBed.inject(PayslipService) as jasmine.SpyObj<PayslipService>;
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;

    // Setup default returns
    mockPayslipService.getMyPayslipHistory.and.returnValue(of([]));
    mockPayslipService.getMyCurrentPayslip.and.returnValue(of(null));
    mockUserService.fetchAllUsers.and.returnValue(of([]));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render payslip history component', () => {
    const compiled = fixture.nativeElement;
    const payslipHistoryElement = compiled.querySelector('app-payslip-history');
    expect(payslipHistoryElement).toBeTruthy();
  });

  it('should have the correct component structure', () => {
    expect(component).toBeInstanceOf(PayslipDashboard);
  });
});

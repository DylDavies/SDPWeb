import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { PayslipHistory } from './payslip-history';
import { PayslipService } from '../../../../services/payslip-service';
import { AuthService } from '../../../../services/auth-service';
import { SnackBarService } from '../../../../services/snackbar-service';
import { EPayslipStatus } from '../../../../models/enums/payslip-status.enum';
import { EUserType } from '../../../../models/enums/user-type.enum';
import { IPayslip } from '../../../../models/interfaces/IPayslip.interface';
import { IUser, IRateAdjustment } from '../../../../models/interfaces/IUser.interface';

describe('PayslipHistory', () => {
  let component: PayslipHistory;
  let fixture: ComponentFixture<PayslipHistory>;
  let mockPayslipService: jasmine.SpyObj<PayslipService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockSnackBarService: jasmine.SpyObj<SnackBarService>;

  const mockRateAdjustments: IRateAdjustment[] = [
    {
      _id: 'rate1',
      previousRate: 100,
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase'
    },
    {
      _id: 'rate2',
      previousRate: 80,
      newRate: 100,
      effectiveDate: new Date('2024-06-01'),
      reason: 'Initial rate'
    }
  ];

  const mockUser: IUser = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    type: EUserType.Tutor,
    accountStatus: 'Active',
    isProfileComplete: true,
    rateAdjustments: mockRateAdjustments
  };

  const mockPayslips: IPayslip[] = [
    {
      _id: 'payslip1',
      userId: 'user1',
      payPeriod: '2024-09',
      status: EPayslipStatus.DRAFT,
      grossEarnings: 5000,
      totalDeductions: 500,
      netPay: 4500,
      paye: 750,
      uif: 50,
      earnings: [
        {
          description: 'Teaching Hours',
          baseRate: 50,
          hours: 20,
          rate: 150,
          total: 3050,
          date: '2024-09-15'
        }
      ],
      bonuses: [
        { description: 'Performance Bonus', amount: 500 }
      ],
      miscEarnings: [
        { description: 'Overtime', amount: 250 }
      ],
      deductions: [
        { description: 'Equipment Fee', amount: 150 }
      ],
      notes: [
        {
          _id: 'note1',
          itemId: 'earning-0',
          note: 'Unresolved query',
          resolved: false,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      _id: 'payslip2',
      userId: 'user1',
      payPeriod: '2024-08',
      status: EPayslipStatus.PAID,
      grossEarnings: 4000,
      totalDeductions: 400,
      netPay: 3600,
      paye: 600,
      uif: 40,
      earnings: [],
      bonuses: [
        { description: 'Monthly Bonus', amount: 300 }
      ],
      miscEarnings: [],
      deductions: [],
      notes: [
        {
          _id: 'note2',
          itemId: 'general',
          note: 'Resolved query',
          resolved: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  const mockCurrentPayslip: IPayslip = {
    ...mockPayslips[0]
  };

  beforeEach(async () => {
    const payslipServiceSpy = jasmine.createSpyObj('PayslipService', [
      'getMyPayslipHistory',
      'getMyCurrentPayslip',
      'generateCurrentPayslip'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser$'], {
      currentUser$: of(mockUser)
    });
    const snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', [
      'showSuccess',
      'showError'
    ]);

    await TestBed.configureTestingModule({
      imports: [PayslipHistory, NoopAnimationsModule],
      providers: [
        { provide: PayslipService, useValue: payslipServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PayslipHistory);
    component = fixture.componentInstance;

    mockPayslipService = TestBed.inject(PayslipService) as jasmine.SpyObj<PayslipService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockSnackBarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;

    // Setup default service returns
    mockPayslipService.getMyPayslipHistory.and.returnValue(of(mockPayslips));
    mockPayslipService.getMyCurrentPayslip.and.returnValue(of(mockCurrentPayslip));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct page data', (done) => {
    fixture.detectChanges();

    component.pageData$.subscribe(data => {
      expect(data.payslips).toEqual(mockPayslips);
      expect(data.currentPayslip).toEqual(mockCurrentPayslip);
      expect(data.hasCurrentMonthPayslip).toBe(true);
      expect(data.currentMonth).toContain(new Date().getFullYear().toString());
      done();
    });
  });

  describe('hasUnresolvedQueries', () => {
    it('should return true when payslip has unresolved queries', () => {
      const result = component.hasUnresolvedQueries(mockPayslips[0]);
      expect(result).toBe(true);
    });

    it('should return false when payslip has only resolved queries', () => {
      const result = component.hasUnresolvedQueries(mockPayslips[1]);
      expect(result).toBe(false);
    });

    it('should return false when payslip has no notes', () => {
      const payslipWithoutNotes = { ...mockPayslips[0], notes: [] };
      const result = component.hasUnresolvedQueries(payslipWithoutNotes);
      expect(result).toBe(false);
    });

    it('should return false when notes is undefined', () => {
      const payslipWithoutNotes = { ...mockPayslips[0], notes: undefined };
      const result = component.hasUnresolvedQueries(payslipWithoutNotes);
      expect(result).toBe(false);
    });
  });

  describe('Calculation Methods', () => {
    it('should calculate total bonuses correctly', () => {
      const result = component.getTotalBonuses(mockPayslips[0]);
      expect(result).toBe(500);
    });

    it('should return 0 for payslip with no bonuses', () => {
      const payslipWithoutBonuses = { ...mockPayslips[0], bonuses: [] };
      const result = component.getTotalBonuses(payslipWithoutBonuses);
      expect(result).toBe(0);
    });

    it('should calculate total misc earnings correctly', () => {
      const result = component.getTotalMiscEarnings(mockPayslips[0]);
      expect(result).toBe(250);
    });

    it('should return 0 for payslip with no misc earnings', () => {
      const payslipWithoutMiscEarnings = { ...mockPayslips[0], miscEarnings: [] };
      const result = component.getTotalMiscEarnings(payslipWithoutMiscEarnings);
      expect(result).toBe(0);
    });

    it('should calculate total income correctly', () => {
      const result = component.getTotalIncome(mockPayslips[0]);
      expect(result).toBe(5750); // 5000 gross + 500 bonus + 250 misc
    });

    it('should calculate net pay correctly', () => {
      const result = component.getCalculatedNetPay(mockPayslips[0]);
      expect(result).toBe(4950); // 5750 total income - 500 deductions - 750 paye - 50 uif
    });

    it('should handle missing values in calculations', () => {
      const incompletePayslip: IPayslip = {
        ...mockPayslips[0],
        grossEarnings: undefined,
        totalDeductions: undefined,
        paye: undefined,
        uif: undefined,
        bonuses: undefined,
        miscEarnings: undefined
      };

      const totalIncome = component.getTotalIncome(incompletePayslip);
      const netPay = component.getCalculatedNetPay(incompletePayslip);

      expect(totalIncome).toBe(0);
      expect(netPay).toBe(0);
    });
  });

  describe('getCurrentUserRate', () => {
    it('should return the most recent rate', () => {
      const rate = component.getCurrentUserRate(mockUser);
      expect(rate).toBe(150);
    });

    it('should return 0 when user has no rate adjustments', () => {
      const userWithoutRates = { ...mockUser, rateAdjustments: [] };
      const rate = component.getCurrentUserRate(userWithoutRates);
      expect(rate).toBe(0);
    });

    it('should return 0 when user is null', () => {
      const rate = component.getCurrentUserRate(null);
      expect(rate).toBe(0);
    });

    it('should return 0 when rateAdjustments is undefined', () => {
      const userWithoutRates = { ...mockUser, rateAdjustments: undefined };
      const rate = component.getCurrentUserRate(userWithoutRates);
      expect(rate).toBe(0);
    });
  });

  describe('getCurrentMonthLabel', () => {
    it('should return current month and year', () => {
      const label = component.getCurrentMonthLabel();
      const now = new Date();
      const expected = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      expect(label).toBe(expected);
    });
  });

  describe('generateCurrentPayslip', () => {
    it('should generate payslip and show success message', () => {
      mockPayslipService.generateCurrentPayslip.and.returnValue(of(mockCurrentPayslip));
      spyOn(component['refreshTrigger$'], 'next');

      component.generateCurrentPayslip();

      expect(mockPayslipService.generateCurrentPayslip).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith(
        jasmine.stringContaining('Payslip generated for')
      );
      expect(component['refreshTrigger$'].next).toHaveBeenCalled();
    });

    it('should handle generation error', () => {
      const error = new Error('Generation failed');
      mockPayslipService.generateCurrentPayslip.and.returnValue(throwError(() => error));
      spyOn(console, 'error');

      component.generateCurrentPayslip();

      expect(mockSnackBarService.showError).toHaveBeenCalledWith(
        'Failed to generate payslip. It may already exist or there was a server error.'
      );
      expect(console.error).toHaveBeenCalledWith('Error generating payslip:', error);
    });
  });

  describe('Data refresh functionality', () => {
    it('should refresh data when refresh trigger is called', (done) => {
      fixture.detectChanges();

      // Subscribe to pageData$ first
      component.pageData$.subscribe(() => {
        expect(mockPayslipService.getMyPayslipHistory).toHaveBeenCalled();
        expect(mockPayslipService.getMyCurrentPayslip).toHaveBeenCalled();
        done();
      });
    });

    it('should handle null current payslip', (done) => {
      mockPayslipService.getMyCurrentPayslip.and.returnValue(of(null));
      fixture.detectChanges();

      component.pageData$.subscribe(data => {
        expect(data.currentPayslip).toBeNull();
        expect(data.hasCurrentMonthPayslip).toBe(false);
        done();
      });
    });
  });

  describe('Edge cases', () => {
    it('should handle empty payslip history', (done) => {
      mockPayslipService.getMyPayslipHistory.and.returnValue(of([]));
      fixture.detectChanges();

      component.pageData$.subscribe(data => {
        expect(data.payslips).toEqual([]);
        done();
      });
    });

    it('should handle service errors gracefully', (done) => {
      mockPayslipService.getMyPayslipHistory.and.returnValue(throwError(() => new Error('Service error')));
      mockPayslipService.getMyCurrentPayslip.and.returnValue(of(null));
      fixture.detectChanges();

      component.pageData$.subscribe({
        next: () => {
          // Should not reach here
          fail('Should not emit data on error');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });
    });
  });
});
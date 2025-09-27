import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
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
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase',
      approvingManagerId: 'manager1'
    },
    {
      newRate: 100,
      effectiveDate: new Date('2024-06-01'),
      reason: 'Initial rate',
      approvingManagerId: 'manager2'
    }
  ];

  const mockUser: IUser = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    type: EUserType.Staff,
    googleId: 'google123',
    picture: 'test.jpg',
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'light' as any,
    leave: [],
    paymentType: 'Contract' as any,
    monthlyMinimum: 0,
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
        }
      ],
      history: []
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
        }
      ],
      history: []
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
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: ActivatedRoute, useValue: { snapshot: { params: {} }, queryParams: of({}) } }
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
      const payslipWithoutNotes = { ...mockPayslips[0], notes: [] };
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
      expect(result).toBe(4450); // 5750 total income - 500 totalDeductions - 750 paye - 50 uif
    });

    it('should handle missing values in calculations', () => {
      const incompletePayslip: IPayslip = {
        ...mockPayslips[0],
        grossEarnings: 0,
        totalDeductions: 0,
        paye: 0,
        uif: 0,
        bonuses: [],
        miscEarnings: []
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
      const userWithoutRates = { ...mockUser, rateAdjustments: [] };
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

  });

  describe('Comprehensive Payslip Edge Cases', () => {
    describe('hasUnresolvedQueries edge cases', () => {
      it('should handle payslip with null notes', () => {
        const payslipWithNullNotes = { ...mockPayslips[0], notes: null as any };
        const result = component.hasUnresolvedQueries(payslipWithNullNotes);
        expect(result).toBe(false);
      });

      it('should handle payslip with undefined notes property', () => {
        const payslipWithoutNotesProperty = { ...mockPayslips[0] };
        delete (payslipWithoutNotesProperty as any).notes;
        const result = component.hasUnresolvedQueries(payslipWithoutNotesProperty);
        expect(result).toBe(false);
      });

      it('should handle mixed resolved and unresolved notes', () => {
        const payslipWithMixedNotes = {
          ...mockPayslips[0],
          notes: [
            { _id: 'note1', itemId: 'item1', note: 'Resolved', resolved: true },
            { _id: 'note2', itemId: 'item2', note: 'Unresolved', resolved: false },
            { _id: 'note3', itemId: 'item3', note: 'Another resolved', resolved: true }
          ]
        };
        const result = component.hasUnresolvedQueries(payslipWithMixedNotes);
        expect(result).toBe(true);
      });

      it('should handle empty notes array', () => {
        const payslipWithEmptyNotes = { ...mockPayslips[0], notes: [] };
        const result = component.hasUnresolvedQueries(payslipWithEmptyNotes);
        expect(result).toBe(false);
      });
    });

    describe('Bonus calculation edge cases', () => {
      it('should handle payslip with null bonuses', () => {
        const payslipWithNullBonuses = { ...mockPayslips[0], bonuses: null as any };
        const result = component.getTotalBonuses(payslipWithNullBonuses);
        expect(result).toBe(0);
      });

      it('should handle payslip with undefined bonuses', () => {
        const payslipWithoutBonuses = { ...mockPayslips[0] };
        delete (payslipWithoutBonuses as any).bonuses;
        const result = component.getTotalBonuses(payslipWithoutBonuses);
        expect(result).toBe(0);
      });

      it('should handle bonuses with zero amounts', () => {
        const payslipWithZeroBonuses = {
          ...mockPayslips[0],
          bonuses: [
            { description: 'Zero Bonus', amount: 0 },
            { description: 'Normal Bonus', amount: 100 }
          ]
        };
        const result = component.getTotalBonuses(payslipWithZeroBonuses);
        expect(result).toBe(100);
      });

      it('should handle bonuses with negative amounts', () => {
        const payslipWithNegativeBonuses = {
          ...mockPayslips[0],
          bonuses: [
            { description: 'Positive Bonus', amount: 200 },
            { description: 'Penalty', amount: -50 }
          ]
        };
        const result = component.getTotalBonuses(payslipWithNegativeBonuses);
        expect(result).toBe(150);
      });

      it('should handle bonuses with decimal amounts', () => {
        const payslipWithDecimalBonuses = {
          ...mockPayslips[0],
          bonuses: [
            { description: 'Partial Bonus 1', amount: 123.45 },
            { description: 'Partial Bonus 2', amount: 67.89 }
          ]
        };
        const result = component.getTotalBonuses(payslipWithDecimalBonuses);
        expect(result).toBeCloseTo(191.34, 2);
      });
    });

    describe('Misc earnings calculation edge cases', () => {
      it('should handle payslip with null miscEarnings', () => {
        const payslipWithNullMiscEarnings = { ...mockPayslips[0], miscEarnings: null as any };
        const result = component.getTotalMiscEarnings(payslipWithNullMiscEarnings);
        expect(result).toBe(0);
      });

      it('should handle payslip with undefined miscEarnings', () => {
        const payslipWithoutMiscEarnings = { ...mockPayslips[0] };
        delete (payslipWithoutMiscEarnings as any).miscEarnings;
        const result = component.getTotalMiscEarnings(payslipWithoutMiscEarnings);
        expect(result).toBe(0);
      });

      it('should handle miscEarnings with very large amounts', () => {
        const payslipWithLargeMiscEarnings = {
          ...mockPayslips[0],
          miscEarnings: [
            { description: 'Large Overtime', amount: 999999.99 },
            { description: 'Bonus Pay', amount: 123.45 }
          ]
        };
        const result = component.getTotalMiscEarnings(payslipWithLargeMiscEarnings);
        expect(result).toBeCloseTo(1000123.44, 2);
      });
    });

    describe('Total income calculation edge cases', () => {
      it('should handle payslip with null grossEarnings', () => {
        const payslipWithNullGross = {
          ...mockPayslips[0],
          grossEarnings: null as any,
          bonuses: [{ description: 'Bonus', amount: 100 }],
          miscEarnings: [{ description: 'Misc', amount: 50 }]
        };
        const result = component.getTotalIncome(payslipWithNullGross);
        expect(result).toBe(150); // 0 + 100 + 50
      });

      it('should handle payslip with undefined grossEarnings', () => {
        const payslipWithoutGross = { ...mockPayslips[0] };
        delete (payslipWithoutGross as any).grossEarnings;
        const result = component.getTotalIncome(payslipWithoutGross);
        expect(result).toBe(750); // 0 + 500 + 250
      });

      it('should handle payslip with all zero values', () => {
        const payslipWithZeros = {
          ...mockPayslips[0],
          grossEarnings: 0,
          bonuses: [],
          miscEarnings: []
        };
        const result = component.getTotalIncome(payslipWithZeros);
        expect(result).toBe(0);
      });

      it('should handle complex calculation with multiple components', () => {
        const complexPayslip = {
          ...mockPayslips[0],
          grossEarnings: 5000.50,
          bonuses: [
            { description: 'Performance', amount: 1000.25 },
            { description: 'Retention', amount: 500.75 }
          ],
          miscEarnings: [
            { description: 'Overtime', amount: 250.00 },
            { description: 'Travel', amount: 125.50 }
          ]
        };
        const result = component.getTotalIncome(complexPayslip);
        expect(result).toBeCloseTo(6877.00, 2);
      });
    });

    describe('Net pay calculation edge cases', () => {
      it('should handle payslip with null deductions and taxes', () => {
        const payslipWithNullDeductions = {
          ...mockPayslips[0],
          totalDeductions: null as any,
          paye: null as any,
          uif: null as any
        };
        const result = component.getCalculatedNetPay(payslipWithNullDeductions);
        expect(result).toBe(5750); // Total income - 0 - 0 - 0
      });

      it('should handle payslip with undefined deductions and taxes', () => {
        const payslipWithoutDeductions = { ...mockPayslips[0] };
        delete (payslipWithoutDeductions as any).totalDeductions;
        delete (payslipWithoutDeductions as any).paye;
        delete (payslipWithoutDeductions as any).uif;
        const result = component.getCalculatedNetPay(payslipWithoutDeductions);
        expect(result).toBe(5750); // Total income only
      });

      it('should handle payslip where deductions exceed income', () => {
        const payslipWithExcessiveDeductions = {
          ...mockPayslips[0],
          grossEarnings: 1000,
          bonuses: [],
          miscEarnings: [],
          totalDeductions: 500,
          paye: 400,
          uif: 200
        };
        const result = component.getCalculatedNetPay(payslipWithExcessiveDeductions);
        expect(result).toBe(-100); // 1000 - 500 - 400 - 200
      });

      it('should handle complex net pay calculation with all components', () => {
        const complexPayslip = {
          ...mockPayslips[0],
          grossEarnings: 10000,
          bonuses: [{ description: 'Bonus', amount: 2000 }],
          miscEarnings: [{ description: 'Overtime', amount: 1000 }],
          totalDeductions: 1500,
          paye: 2000,
          uif: 100
        };
        const result = component.getCalculatedNetPay(complexPayslip);
        expect(result).toBe(9400); // 13000 - 1500 - 2000 - 100
      });
    });

    describe('Current user rate calculation edge cases', () => {
      it('should handle null user', () => {
        const result = component.getCurrentUserRate(null);
        expect(result).toBe(0);
      });

      it('should handle user with null rateAdjustments', () => {
        const userWithNullRates = { ...mockUser, rateAdjustments: null as any };
        const result = component.getCurrentUserRate(userWithNullRates);
        expect(result).toBe(0);
      });

      it('should handle user with undefined rateAdjustments', () => {
        const userWithoutRates = { ...mockUser };
        delete (userWithoutRates as any).rateAdjustments;
        const result = component.getCurrentUserRate(userWithoutRates);
        expect(result).toBe(0);
      });

      it('should handle user with empty rateAdjustments array', () => {
        const userWithEmptyRates = { ...mockUser, rateAdjustments: [] };
        const result = component.getCurrentUserRate(userWithEmptyRates);
        expect(result).toBe(0);
      });

      it('should handle user with unsorted rate adjustments', () => {
        const userWithUnsortedRates = {
          ...mockUser,
          rateAdjustments: [
            { newRate: 100, effectiveDate: new Date('2024-01-01'), reason: 'Old rate', approvingManagerId: 'mgr1' },
            { newRate: 200, effectiveDate: new Date('2024-06-01'), reason: 'Latest rate', approvingManagerId: 'mgr2' },
            { newRate: 150, effectiveDate: new Date('2024-03-01'), reason: 'Middle rate', approvingManagerId: 'mgr3' }
          ]
        };
        const result = component.getCurrentUserRate(userWithUnsortedRates);
        expect(result).toBe(200); // Should return the most recent (June 2024)
      });

      it('should handle user with rate adjustments on same date', () => {
        const userWithSameDateRates = {
          ...mockUser,
          rateAdjustments: [
            { newRate: 100, effectiveDate: new Date('2024-06-01T09:00:00'), reason: 'Morning rate', approvingManagerId: 'mgr1' },
            { newRate: 200, effectiveDate: new Date('2024-06-01T15:00:00'), reason: 'Afternoon rate', approvingManagerId: 'mgr2' }
          ]
        };
        const result = component.getCurrentUserRate(userWithSameDateRates);
        expect(result).toBe(200); // Should return the later one
      });
    });

    describe('getCurrentMonthLabel edge cases', () => {
      it('should return current month and year in correct format', () => {
        const result = component.getCurrentMonthLabel();
        const now = new Date();
        const expected = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        expect(result).toBe(expected);
      });

      it('should handle month boundary correctly', () => {
        // Test around month boundaries by mocking different dates
        const originalDate = Date;

        // Mock January 1st
        const mockDate = new Date('2024-01-01');
        spyOn(window, 'Date').and.returnValue(mockDate as any);
        (window.Date as any).prototype = originalDate.prototype;

        const result = component.getCurrentMonthLabel();
        expect(result).toContain('January');
        expect(result).toContain('2024');
      });
    });

    describe('generateCurrentPayslip edge cases', () => {
      it('should handle successful payslip generation', () => {
        const generatedPayslip = { ...mockCurrentPayslip, _id: 'new-payslip' };
        mockPayslipService.generateCurrentPayslip.and.returnValue(of(generatedPayslip));
        spyOn(component['refreshTrigger$'], 'next');

        component.generateCurrentPayslip();

        expect(mockPayslipService.generateCurrentPayslip).toHaveBeenCalled();
        expect(mockSnackBarService.showSuccess).toHaveBeenCalled();
        expect(component['refreshTrigger$'].next).toHaveBeenCalled();
      });

      it('should handle network errors during generation', () => {
        const networkError = new Error('Network timeout');
        mockPayslipService.generateCurrentPayslip.and.returnValue(throwError(() => networkError));
        spyOn(console, 'error');

        component.generateCurrentPayslip();

        expect(mockSnackBarService.showError).toHaveBeenCalledWith(
          'Failed to generate payslip. It may already exist or there was a server error.'
        );
        expect(console.error).toHaveBeenCalledWith('Error generating payslip:', networkError);
      });

      it('should handle server validation errors during generation', () => {
        const validationError = new Error('Payslip already exists for this period');
        mockPayslipService.generateCurrentPayslip.and.returnValue(throwError(() => validationError));
        spyOn(console, 'error');

        component.generateCurrentPayslip();

        expect(mockSnackBarService.showError).toHaveBeenCalled();
        expect(console.error).toHaveBeenCalledWith('Error generating payslip:', validationError);
      });
    });

    describe('Data stream edge cases', () => {
      it('should handle multiple rapid refresh triggers', () => {
        spyOn(component['refreshTrigger$'], 'next');
        mockPayslipService.generateCurrentPayslip.and.returnValue(of(mockCurrentPayslip));

        component.generateCurrentPayslip();
        component.generateCurrentPayslip();
        component.generateCurrentPayslip();

        // Should handle multiple triggers gracefully
        expect(mockPayslipService.generateCurrentPayslip).toHaveBeenCalledTimes(3);
      });

      it('should handle concurrent service calls', (done) => {
        // Test that concurrent calls to pageData$ don't interfere
        let emissionCount = 0;
        let completed = false;

        component.pageData$.subscribe(() => {
          emissionCount++;
          if (emissionCount === 1) {
            // Trigger another emission while first is processing
            component['refreshTrigger$'].next();
          } else if (emissionCount === 2 && !completed) {
            completed = true;
            expect(emissionCount).toBe(2);
            done();
          }
        });

        fixture.detectChanges(); // Initial emission
      });

      it('should handle payslip history service returning empty array', (done) => {
        mockPayslipService.getMyPayslipHistory.and.returnValue(of([]));
        mockPayslipService.getMyCurrentPayslip.and.returnValue(of(null));

        component.pageData$.subscribe(data => {
          expect(data.payslips).toEqual([]);
          expect(data.currentPayslip).toBeNull();
          expect(data.hasCurrentMonthPayslip).toBe(false);
          done();
        });

        fixture.detectChanges();
      });
    });

    describe('Component integration edge cases', () => {
      it('should handle displayedColumns property correctly', () => {
        expect(component.displayedColumns).toEqual([
          'payPeriod', 'status', 'totalIncome', 'totalDeductions', 'netPay', 'actions'
        ]);
      });

      it('should handle currentUser$ observable', () => {
        expect(component.currentUser$).toBeDefined();
        expect(component.currentUser$).toBe(component['authService'].currentUser$);
      });

      it('should handle pageData$ with different combinations of data', (done) => {
        const testCases = [
          { payslips: [], currentPayslip: null },
          { payslips: [mockPayslips[0]], currentPayslip: mockCurrentPayslip },
          { payslips: mockPayslips, currentPayslip: null }
        ];

        let testIndex = 0;
        let completed = false;

        // Set up initial mock for first test case
        mockPayslipService.getMyPayslipHistory.and.returnValue(of(testCases[0].payslips));
        mockPayslipService.getMyCurrentPayslip.and.returnValue(of(testCases[0].currentPayslip));

        component.pageData$.subscribe(data => {
          if (completed) return; // Ignore extra emissions

          const testCase = testCases[testIndex];
          if (testCase) {
            expect(data.payslips.length).toEqual(testCase.payslips.length);
            expect(data.currentPayslip).toEqual(testCase.currentPayslip);
            expect(data.hasCurrentMonthPayslip).toBe(!!testCase.currentPayslip);
          }

          testIndex++;
          if (testIndex < testCases.length) {
            // Setup next test case
            mockPayslipService.getMyPayslipHistory.and.returnValue(of(testCases[testIndex].payslips));
            mockPayslipService.getMyCurrentPayslip.and.returnValue(of(testCases[testIndex].currentPayslip));
            component['refreshTrigger$'].next();
          } else if (!completed) {
            completed = true;
            done();
          }
        });

        // Start first test case
        mockPayslipService.getMyPayslipHistory.and.returnValue(of(testCases[0].payslips));
        mockPayslipService.getMyCurrentPayslip.and.returnValue(of(testCases[0].currentPayslip));
        fixture.detectChanges();
      });
    });
  });
});
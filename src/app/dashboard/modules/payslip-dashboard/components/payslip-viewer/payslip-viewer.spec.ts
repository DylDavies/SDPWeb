import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject, throwError, delay } from 'rxjs';

import { PayslipViewer } from './payslip-viewer';
import { PayslipService } from '../../../../../services/payslip-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AuthService } from '../../../../../services/auth-service';
import { EPayslipStatus } from '../../../../../models/enums/payslip-status.enum';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { IPayslip } from '../../../../../models/interfaces/IPayslip.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IPreapprovedItem } from '../../../../../models/interfaces/IPreapprovedItem.interface';

describe('PayslipViewer', () => {
  let component: PayslipViewer;
  let fixture: ComponentFixture<PayslipViewer>;
  let mockActivatedRoute: jasmine.SpyObj<ActivatedRoute>;
  let mockPayslipService: jasmine.SpyObj<PayslipService>;
  let mockSnackBarService: jasmine.SpyObj<SnackBarService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  // Mock data
  const mockUser: IUser = {
    _id: 'user1',
    googleId: 'google1',
    email: 'test@example.com',
    displayName: 'Test User',
    picture: 'pic.jpg',
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    type: EUserType.Staff,
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'light' as any,
    leave: [],
    proficiencies: [],
    availability: 40,
    badges: [],
    paymentType: 'Contract',
    monthlyMinimum: 1000,
    rateAdjustments: []
  };

  const mockPayslip: IPayslip = {
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
    notes: [],
    history: []
  };

  const mockPreapprovedItems: IPreapprovedItem[] = [
    {
      _id: 'item1',
      itemName: 'Performance Bonus',
      itemType: 'bonus' as any,
      defaultAmount: 500,
      isAdminOnly: false
    }
  ];

  beforeEach(async () => {
    const activatedRouteSpy = jasmine.createSpyObj('ActivatedRoute', ['paramMap'], {
      paramMap: of(new Map([['id', 'payslip1']]))
    });
    const payslipServiceSpy = jasmine.createSpyObj('PayslipService', [
      'getPayslipById',
      'getPreapprovedItems',
      'updatePayslipStatus',
      'addBonus',
      'removeBonus',
      'addDeduction',
      'updateDeduction',
      'removeDeduction',
      'addMiscEarning',
      'updateMiscEarning',
      'removeMiscEarning'
    ]);
    const snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', [
      'showSuccess',
      'showError'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['currentUser$'], {
      currentUser$: of(mockUser)
    });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [PayslipViewer, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: PayslipService, useValue: payslipServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayslipViewer);
    component = fixture.componentInstance;

    mockActivatedRoute = TestBed.inject(ActivatedRoute) as jasmine.SpyObj<ActivatedRoute>;
    mockPayslipService = TestBed.inject(PayslipService) as jasmine.SpyObj<PayslipService>;
    mockSnackBarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Setup default returns
    mockPayslipService.getPayslipById.and.returnValue(of(mockPayslip));
    mockPayslipService.getPreapprovedItems.and.returnValue(of(mockPreapprovedItems));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct data', () => {
    fixture.detectChanges();

    expect(mockPayslipService.getPayslipById).toHaveBeenCalledWith('payslip1');
    expect(mockPayslipService.getPreapprovedItems).toHaveBeenCalled();
  });

  describe('submitForApproval', () => {
    it('should update payslip status to STAFF_APPROVED', () => {
      const updatedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      mockPayslipService.updatePayslipStatus.and.returnValue(of(updatedPayslip));
      spyOn(component, 'loadPayslipData');

      component.submitForApproval(mockPayslip);

      expect(mockPayslipService.updatePayslipStatus).toHaveBeenCalledWith(
        mockPayslip._id,
        EPayslipStatus.STAFF_APPROVED
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Payslip submitted for approval.');
      expect(component.loadPayslipData).toHaveBeenCalled();
    });
  });

  describe('addSelectedBonus', () => {
    beforeEach(() => {
      fixture.detectChanges();
      // Set up payslip data in component
      component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should show error if no bonus selected', () => {
      component.selectedBonusId = '';

      component.addSelectedBonus();

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Please select a bonus to add');
      expect(mockPayslipService.addBonus).not.toHaveBeenCalled();
    });

    it('should add selected bonus successfully', () => {
      component.selectedBonusId = 'performance';
      mockPayslipService.addBonus.and.returnValue(of(mockPayslip));

      component.addSelectedBonus();

      expect(mockPayslipService.addBonus).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalled();
      expect(component.selectedBonusId).toBe('');
    });

    it('should handle add bonus error', () => {
      component.selectedBonusId = 'performance';
      mockPayslipService.addBonus.and.returnValue(
        throwError(() => new Error('API Error'))
      );

      component.addSelectedBonus();

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to add bonus. Please try again.');
    });
  });

  describe('removeBonus', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should remove bonus successfully', () => {
      mockPayslipService.removeBonus.and.returnValue(of(mockPayslip));

      component.removeBonus(0);

      expect(mockPayslipService.removeBonus).toHaveBeenCalledWith(mockPayslip._id, 0);
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Bonus removed successfully');
    });
  });

  describe('Deduction Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should add new deduction', () => {
      const updatedPayslip = {
        ...mockPayslip,
        deductions: [...mockPayslip.deductions, { description: 'New Deduction', amount: 0 }]
      };
      mockPayslipService.addDeduction.and.returnValue(of(updatedPayslip));
      spyOn(component, 'editDeduction');

      component.addNewDeduction();

      expect(mockPayslipService.addDeduction).toHaveBeenCalled();
      expect(component.editDeduction).toHaveBeenCalled();
    });

    it('should update deduction', () => {
      component.editingDeduction = 0;
      component.editingDeductionData = { description: 'Updated Deduction', amount: 200 };
      mockPayslipService.updateDeduction.and.returnValue(of(mockPayslip));

      component.saveDeductionEdit(0);

      expect(mockPayslipService.updateDeduction).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Deduction updated successfully');
    });

    it('should remove deduction', () => {
      mockPayslipService.removeDeduction.and.returnValue(of(mockPayslip));

      component.removeDeduction(0);

      expect(mockPayslipService.removeDeduction).toHaveBeenCalledWith(mockPayslip._id, 0);
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Deduction removed successfully');
    });
  });

  describe('Misc Earnings Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should add new misc earning', () => {
      const updatedPayslip = {
        ...mockPayslip,
        miscEarnings: [...mockPayslip.miscEarnings, { description: 'New Misc Earning', amount: 0 }]
      };
      mockPayslipService.addMiscEarning.and.returnValue(of(updatedPayslip));
      spyOn(component, 'editMiscEarning');

      component.addNewMiscEarning();

      expect(mockPayslipService.addMiscEarning).toHaveBeenCalled();
      expect(component.editMiscEarning).toHaveBeenCalled();
    });

    it('should update misc earning', () => {
      component.editingMiscEarning = 0;
      component.editingMiscEarningData = { description: 'Updated Earning', amount: 300 };
      mockPayslipService.updateMiscEarning.and.returnValue(of(mockPayslip));

      component.saveMiscEarningEdit(0);

      expect(mockPayslipService.updateMiscEarning).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Misc earning updated successfully');
    });

    it('should remove misc earning', () => {
      mockPayslipService.removeMiscEarning.and.returnValue(of(mockPayslip));

      component.removeMiscEarning(0);

      expect(mockPayslipService.removeMiscEarning).toHaveBeenCalledWith(mockPayslip._id, 0);
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Misc earning removed successfully');
    });
  });

  describe('Calculation Methods', () => {
    it('should calculate total bonuses correctly', () => {
      const bonuses = [
        { description: 'Bonus 1', amount: 100 },
        { description: 'Bonus 2', amount: 200 }
      ];

      const total = component.getTotalBonuses(bonuses);

      expect(total).toBe(300);
    });

    it('should calculate total misc earnings correctly', () => {
      const miscEarnings = [
        { description: 'Earning 1', amount: 150 },
        { description: 'Earning 2', amount: 250 }
      ];

      const total = component.getTotalMiscEarnings(miscEarnings);

      expect(total).toBe(400);
    });

    it('should calculate earning total correctly', () => {
      const total = component.calculateEarningTotal(10, 50);

      expect(total).toBe(500);
    });

    it('should calculate gross earnings correctly', () => {
      const earnings = [
        { description: 'Test', baseRate: 50, hours: 10, rate: 100, total: 1050, date: '2024-09-01' },
        { description: 'Test 2', baseRate: 30, hours: 5, rate: 80, total: 430, date: '2024-09-02' }
      ];

      const gross = component.calculateGrossEarnings(earnings);

      expect(gross).toBe(1480);
    });
  });

  describe('Query Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should check if item has query', () => {
      const payslipWithQuery = {
        ...mockPayslip,
        notes: [{ itemId: 'earning-0', resolved: false, note: 'Test query' }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithQuery });

      const hasQuery = component.hasQuery('Test Item', 'earning', 0);

      expect(hasQuery).toBe(true);
    });

    it('should get query details', () => {
      const testNote = { itemId: 'earning-0', resolved: false, note: 'Test query' };
      const payslipWithQuery = {
        ...mockPayslip,
        notes: [testNote]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithQuery });

      const queryDetails = component.getQueryDetails('Test Item', 'earning', 0);

      expect(queryDetails).toEqual(testNote);
    });
  });

  describe('User Information Methods', () => {
    it('should get current user name', () => {
      const userName = component.getCurrentUserName();

      expect(userName).toBe('Test User');
    });

    it('should get current user email', () => {
      const userEmail = component.getCurrentUserEmail();

      expect(userEmail).toBe('test@example.com');
    });

    it('should check if current user is admin', () => {
      const isAdmin = component.isCurrentUserAdmin();

      expect(isAdmin).toBe(false);
    });
  });

  describe('Payslip Status Methods', () => {
    it('should determine if payslip can be edited', () => {
      const canEdit = component.canEditPayslip(mockPayslip);

      expect(canEdit).toBe(true);
    });

    it('should determine if approved payslip cannot be edited', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };

      const canEdit = component.canEditPayslip(approvedPayslip);

      expect(canEdit).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should prevent invalid characters in amount input', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: 'a' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onAmountKeydown(event, 'deduction');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric input', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '5' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onAmountKeydown(event, 'deduction');

      expect(event.preventDefault).not.toHaveBeenCalled();
    });
  });

  describe('Query Management', () => {
    it('should return false when checking for queries without payslip data', () => {
      component['payslipDataSubject'].next(null);

      const hasQuery = component.hasQuery('Test Description', 'bonus');

      expect(hasQuery).toBe(false);
    });

    it('should return false when checking for queries with no notes', () => {
      const payslipWithoutNotes = { ...mockPayslip, notes: [] };
      component['payslipDataSubject'].next({ payslip: payslipWithoutNotes });

      const hasQuery = component.hasQuery('Test Description', 'bonus');

      expect(hasQuery).toBe(false);
    });

    it('should find existing query by description', () => {
      const payslipWithNotes = {
        ...mockPayslip,
        notes: [{ itemId: 'Test Description', note: 'Query content', resolved: false }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes });

      const hasQuery = component.hasQuery('Test Description', 'bonus');

      expect(hasQuery).toBe(true);
    });

    it('should get query details when query exists', () => {
      const note = { itemId: 'Test Description', note: 'Query content', resolved: false };
      const payslipWithNotes = { ...mockPayslip, notes: [note] };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes });

      const queryDetails = component.getQueryDetails('Test Description', 'bonus');

      expect(queryDetails).toEqual(note);
    });

    it('should return undefined when query does not exist', () => {
      const payslipWithNotes = { ...mockPayslip, notes: [] };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes });

      const queryDetails = component.getQueryDetails('Non-existent', 'bonus');

      expect(queryDetails).toBeUndefined();
    });
  });

  describe('User Information Methods', () => {
    it('should return current user name', () => {
      const userName = component.getCurrentUserName();

      expect(userName).toBe('Test User');
    });

    it('should return current user email', () => {
      const userEmail = component.getCurrentUserEmail();

      expect(userEmail).toBe('test@example.com');
    });

    it('should return false for non-admin user', () => {
      const isAdmin = component.isCurrentUserAdmin();

      expect(isAdmin).toBe(false);
    });

    it('should return true for admin user', () => {
      const adminUser = { ...mockUser, type: EUserType.Admin };

      // Spy on the private getCurrentUser method
      spyOn(component as any, 'getCurrentUser').and.returnValue(adminUser);

      const isAdmin = component.isCurrentUserAdmin();

      expect(isAdmin).toBe(true);
    });
  });

  describe('Dialog Methods', () => {
    it('should not open query dialog when no payslip data', () => {
      component['payslipDataSubject'].next(null);

      component.openQueryDialog(null, 'general');

      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should open query dialog with correct data', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip });
      const mockDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openQueryDialog(null, 'general');

      expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), {
        width: '600px',
        data: {
          payslip: mockPayslip,
          selectedItem: null,
          itemType: 'general',
          itemIndex: undefined,
          existingQuery: undefined
        }
      });
    });
  });

  describe('Calculation Methods', () => {
    it('should calculate earning total correctly', () => {
      const total = component.calculateEarningTotal(10, 50);

      expect(total).toBe(500);
    });

    it('should calculate gross earnings from earnings array', () => {
      const earnings = [
        { description: 'Test', baseRate: 50, hours: 10, rate: 50, total: 500, date: '2024-01-01' },
        { description: 'Test2', baseRate: 30, hours: 5, rate: 30, total: 150, date: '2024-01-02' }
      ];

      const gross = component.calculateGrossEarnings(earnings);

      expect(gross).toBe(650);
    });

    it('should calculate total bonuses', () => {
      const bonuses = [
        { description: 'Bonus 1', amount: 100 },
        { description: 'Bonus 2', amount: 200 }
      ];

      const total = component.getTotalBonuses(bonuses);

      expect(total).toBe(300);
    });

    it('should calculate total misc earnings', () => {
      const miscEarnings = [
        { amount: 50 },
        { amount: 75 }
      ];

      const total = component.getTotalMiscEarnings(miscEarnings);

      expect(total).toBe(125);
    });
  });

  describe('Template and UI Interaction', () => {
    it('should display the correct pay period and status', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.header-info p:nth-child(1)')?.textContent).toContain('September 2024');
      expect(compiled.querySelector('.status-chip')?.textContent).toContain('Draft');
    });


    it('should call openQueryDialog when an earning row is clicked', () => {
      spyOn(component, 'openQueryDialog');
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const row = compiled.querySelector('.payslip-table tbody tr.clickable-row') as HTMLElement;
      row.click();
      expect(component.openQueryDialog).toHaveBeenCalledWith(mockPayslip.earnings[0], 'earning', 0);
    });

    it('should show bonus controls when payslip is in draft status', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.bonus-controls')).not.toBeNull();
    });


  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle getPayslipById failure', () => {
      mockPayslipService.getPayslipById.and.returnValue(throwError(() => new Error('Not Found')));
      spyOn(console, 'error'); // Prevent error from logging to console during test
      fixture.detectChanges();
      expect(component.payslipData$).toBeDefined();
      component.payslipData$.subscribe(data => {
        expect(data).toBeNull();
      });
    });
  });

  describe('Asynchronous Operations', () => {
    it('should handle async data loading correctly with fakeAsync', fakeAsync(() => {
      mockPayslipService.getPayslipById.and.returnValue(of(mockPayslip).pipe(delay(100)));
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.loading-spinner')).not.toBeNull();
      tick(100);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.loading-spinner')).toBeNull();
      expect(fixture.nativeElement.querySelector('.payslip-container')).not.toBeNull();
    }));
  });

  

  describe('Dialog and Query Management', () => {


    it('should refresh data when the addQuery dialog is closed with a result', () => {
      const mockDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      spyOn(component, 'loadPayslipData');

      component.addQuery(mockPayslip);

      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should NOT refresh data when the addQuery dialog is closed without a result', () => {
        const mockDialogRef = { afterClosed: () => of(false) }; // Dialog returns false
        mockDialog.open.and.returnValue(mockDialogRef as any);
        spyOn(component, 'loadPayslipData');

        component.addQuery(mockPayslip);

        expect(component.loadPayslipData).not.toHaveBeenCalled();
    });
  });

  describe('Bonus Management', () => {
    it('should not add a bonus if the selected bonus ID is invalid', () => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip });
      component.selectedBonusId = 'invalid-id'; // Use an ID that doesn't exist

      component.addSelectedBonus();

      expect(mockPayslipService.addBonus).not.toHaveBeenCalled();
    });


    it('should handle an error when removing a bonus', () => {
        mockPayslipService.removeBonus.and.returnValue(throwError(() => new Error('API Error')));
        fixture.detectChanges();
        component['payslipDataSubject'].next({ payslip: mockPayslip });

        component.removeBonus(0);

        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to remove bonus. Please try again.');
    });
  });

  describe('Deduction and Misc Earning Error Handling', () => {
    beforeEach(() => {
        fixture.detectChanges();
        component['payslipDataSubject'].next({ payslip: mockPayslip });
    });

    it('should handle an error when adding a new deduction', () => {
        mockPayslipService.addDeduction.and.returnValue(throwError(() => new Error('API Error')));
        component.addNewDeduction();
        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to add deduction. Please try again.');
    });

    it('should handle an error when updating a deduction', () => {
        mockPayslipService.updateDeduction.and.returnValue(throwError(() => new Error('API Error')));
        component.editingDeduction = 0;
        component.editingDeductionData = { description: 'Fail', amount: 100 };
        component.saveDeductionEdit(0);
        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to update deduction. Please try again.');
    });

    it('should handle an error when removing a misc earning', () => {
        mockPayslipService.removeMiscEarning.and.returnValue(throwError(() => new Error('API Error')));
        component.removeMiscEarning(0);
        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to remove misc earning. Please try again.');
    });

     it('should handle an error when updating a misc earning', () => {
        mockPayslipService.updateMiscEarning.and.returnValue(throwError(() => new Error('API Error')));
        component.editingMiscEarning = 0;
        component.editingMiscEarningData = { description: 'Fail', amount: 100 };
        component.saveMiscEarningEdit(0);
        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to update misc earning. Please try again.');
    });
  });

 describe('Input Validation', () => {

    it('should prevent multiple decimal points', () => {
      const mockInput = { value: '123.' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '.' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onAmountKeydown(event, 'deduction');

      expect(event.preventDefault).toHaveBeenCalled();
    });
  });
  
  
});
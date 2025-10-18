import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, BehaviorSubject, throwError, delay } from 'rxjs';

import { PayslipViewer } from './payslip-viewer';
import { PayslipService } from '../../../../../services/payslip-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AuthService } from '../../../../../services/auth-service';
import { UserService } from '../../../../../services/user-service';
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
  let mockUserService: jasmine.SpyObj<UserService>;
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
    const userServiceSpy = jasmine.createSpyObj('UserService', ['fetchAllUsers'], {
      allUsers$: of([mockUser])
    });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [PayslipViewer, NoopAnimationsModule],
      providers: [
        { provide: ActivatedRoute, useValue: activatedRouteSpy },
        { provide: PayslipService, useValue: payslipServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
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
    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Setup default returns
    mockPayslipService.getPayslipById.and.returnValue(of(mockPayslip));
    mockPayslipService.getPreapprovedItems.and.returnValue(of(mockPreapprovedItems));
    mockUserService.fetchAllUsers.and.returnValue(of([mockUser]));
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
    });

    it('should check if item has query', () => {
      const payslipWithQuery = {
        ...mockPayslip,
        notes: [{ itemId: 'earning-0', resolved: false, note: 'Test query' }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithQuery, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test Item', 'earning', 0);

      expect(hasQuery).toBe(true);
    });

    it('should get query details', () => {
      const testNote = { itemId: 'earning-0', resolved: false, note: 'Test query' };
      const payslipWithQuery = {
        ...mockPayslip,
        notes: [testNote]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithQuery, payslipUser: mockUser, allUsers: [mockUser] });

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
    it('should determine that staff users cannot edit payslip earnings', () => {
      // mockUser is EUserType.Staff, so canEditPayslip should return false
      const canEdit = component.canEditPayslip(mockPayslip);

      expect(canEdit).toBe(false);
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
      component['payslipDataSubject'].next({ payslip: payslipWithoutNotes, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test Description', 'bonus');

      expect(hasQuery).toBe(false);
    });

    it('should find existing query by description', () => {
      const payslipWithNotes = {
        ...mockPayslip,
        notes: [{ itemId: 'Test Description', note: 'Query content', resolved: false }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test Description', 'bonus');

      expect(hasQuery).toBe(true);
    });

    it('should get query details when query exists', () => {
      const note = { itemId: 'Test Description', note: 'Query content', resolved: false };
      const payslipWithNotes = { ...mockPayslip, notes: [note] };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes, payslipUser: mockUser, allUsers: [mockUser] });

      const queryDetails = component.getQueryDetails('Test Description', 'bonus');

      expect(queryDetails).toEqual(note);
    });

    it('should return undefined when query does not exist', () => {
      const payslipWithNotes = { ...mockPayslip, notes: [] };
      component['payslipDataSubject'].next({ payslip: payslipWithNotes, payslipUser: mockUser, allUsers: [mockUser] });

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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      component.selectedBonusId = 'invalid-id'; // Use an ID that doesn't exist

      component.addSelectedBonus();

      expect(mockPayslipService.addBonus).not.toHaveBeenCalled();
    });


    it('should handle an error when removing a bonus', () => {
        mockPayslipService.removeBonus.and.returnValue(throwError(() => new Error('API Error')));
        fixture.detectChanges();
        component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });

        component.removeBonus(0);

        expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to remove bonus. Please try again.');
    });
  });

  describe('Deduction and Misc Earning Error Handling', () => {
    beforeEach(() => {
        fixture.detectChanges();
        component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
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

    it('should allow navigation keys', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const navigationKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'];

      navigationKeys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key });
        Object.defineProperty(event, 'target', { value: mockInput });
        spyOn(event, 'preventDefault');

        component.onAmountKeydown(event, 'deduction');

        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+Z', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const ctrlKeys = ['a', 'c', 'v', 'x', 'z'];

      ctrlKeys.forEach(key => {
        const event = new KeyboardEvent('keydown', { key, ctrlKey: true });
        Object.defineProperty(event, 'target', { value: mockInput });
        spyOn(event, 'preventDefault');

        component.onAmountKeydown(event, 'deduction');

        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should prevent more than 2 decimal places', () => {
      const mockInput = {
        value: '123.45',
        selectionStart: 7,
        selectionEnd: 7
      } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '6' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onAmountKeydown(event, 'deduction');

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow typing when text is selected', () => {
      const mockInput = {
        value: '123.45',
        selectionStart: 4,
        selectionEnd: 6
      } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '6' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onAmountKeydown(event, 'deduction');

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should truncate input to 2 decimal places in onAmountInput for miscEarning', () => {
      const mockInput = { value: '123.456' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;
      component.editingMiscEarningData = { description: 'Test', amount: 0 };

      component.onAmountInput(event, 'miscEarning');

      expect(component.editingMiscEarningData.amount).toBe(123.45);
      expect(mockInput.value).toBe('123.45');
    });

    it('should truncate input to 2 decimal places in onAmountInput for deduction', () => {
      const mockInput = { value: '50.999' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;
      component.editingDeductionData = { description: 'Test', amount: 0 };

      component.onAmountInput(event, 'deduction');

      expect(component.editingDeductionData.amount).toBe(50.99);
      expect(mockInput.value).toBe('50.99');
    });

    it('should handle onAmountInput with no decimal point', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;

      component.onAmountInput(event, 'deduction');

      // Should not throw error
      expect(mockInput.value).toBe('123');
    });
  });

  describe('Additional Branch Coverage Tests', () => {
    beforeEach(() => {
      fixture.detectChanges();
    });

    it('should not add selected bonus when no current data', () => {
      component['payslipDataSubject'].next(null);
      component.selectedBonusId = 'performance';

      component.addSelectedBonus();

      expect(mockPayslipService.addBonus).not.toHaveBeenCalled();
    });

    it('should not add selected bonus when preapproved bonus not found', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      component.selectedBonusId = 'non-existent-id';

      component.addSelectedBonus();

      expect(mockPayslipService.addBonus).not.toHaveBeenCalled();
    });

    it('should not remove bonus when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.removeBonus(0);

      expect(mockPayslipService.removeBonus).not.toHaveBeenCalled();
    });

    it('should not remove bonus when bonuses array is missing', () => {
      const payslipNoBonuses = { ...mockPayslip, bonuses: undefined };
      component['payslipDataSubject'].next({ payslip: payslipNoBonuses as any, payslipUser: mockUser, allUsers: [mockUser] });

      component.removeBonus(0);

      expect(mockPayslipService.removeBonus).not.toHaveBeenCalled();
    });

    it('should not add deduction when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.addNewDeduction();

      expect(mockPayslipService.addDeduction).not.toHaveBeenCalled();
    });

    it('should not save deduction edit when no current data', () => {
      component['payslipDataSubject'].next(null);
      component.editingDeduction = 0;

      component.saveDeductionEdit(0);

      expect(mockPayslipService.updateDeduction).not.toHaveBeenCalled();
    });

    it('should not save deduction edit when editingDeduction is null', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      component.editingDeduction = null;

      component.saveDeductionEdit(0);

      expect(mockPayslipService.updateDeduction).not.toHaveBeenCalled();
    });

    it('should not remove deduction when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.removeDeduction(0);

      expect(mockPayslipService.removeDeduction).not.toHaveBeenCalled();
    });

    it('should not add misc earning when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.addNewMiscEarning();

      expect(mockPayslipService.addMiscEarning).not.toHaveBeenCalled();
    });

    it('should not save misc earning edit when no current data', () => {
      component['payslipDataSubject'].next(null);
      component.editingMiscEarning = 0;

      component.saveMiscEarningEdit(0);

      expect(mockPayslipService.updateMiscEarning).not.toHaveBeenCalled();
    });

    it('should not save misc earning edit when editingMiscEarning is null', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      component.editingMiscEarning = null;

      component.saveMiscEarningEdit(0);

      expect(mockPayslipService.updateMiscEarning).not.toHaveBeenCalled();
    });

    it('should not remove misc earning when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.removeMiscEarning(0);

      expect(mockPayslipService.removeMiscEarning).not.toHaveBeenCalled();
    });

    it('should handle getTotalBonuses with null bonuses array', () => {
      const total = component.getTotalBonuses(null as any);

      expect(total).toBe(0);
    });

    it('should handle getTotalBonuses with undefined bonuses array', () => {
      const total = component.getTotalBonuses(undefined as any);

      expect(total).toBe(0);
    });

    it('should handle getTotalMiscEarnings with null array', () => {
      const total = component.getTotalMiscEarnings(null as any);

      expect(total).toBe(0);
    });

    it('should handle getTotalMiscEarnings with undefined array', () => {
      const total = component.getTotalMiscEarnings(undefined as any);

      expect(total).toBe(0);
    });

    it('should handle calculateEarningTotal with zero hours', () => {
      const total = component.calculateEarningTotal(0, 50);

      expect(total).toBe(0);
    });

    it('should handle calculateEarningTotal with zero rate', () => {
      const total = component.calculateEarningTotal(10, 0);

      expect(total).toBe(0);
    });

    it('should handle calculateEarningTotal with null values', () => {
      const total = component.calculateEarningTotal(null as any, null as any);

      expect(total).toBe(0);
    });

    it('should calculate gross earnings with missing total and use hours*rate', () => {
      const earnings = [
        { description: 'Test', baseRate: 50, hours: 10, rate: 100, total: undefined as any, date: '2024-09-01' }
      ];

      const gross = component.calculateGrossEarnings(earnings);

      expect(gross).toBe(1000);
    });

    it('should handle calculateGrossEarnings with null array', () => {
      const gross = component.calculateGrossEarnings(null as any);

      expect(gross).toBe(0);
    });

    it('should handle calculateGrossEarnings with undefined array', () => {
      const gross = component.calculateGrossEarnings(undefined as any);

      expect(gross).toBe(0);
    });

    it('should calculate net pay without optional paye and uif', () => {
      const netPay = component.calculateNetPay(5000, mockPayslip.bonuses, 500);

      expect(netPay).toBe(5000);
    });

    it('should calculate net pay with paye only', () => {
      const netPay = component.calculateNetPay(5000, mockPayslip.bonuses, 500, 750);

      expect(netPay).toBe(4250);
    });

    it('should calculate net pay with uif only', () => {
      const netPay = component.calculateNetPay(5000, mockPayslip.bonuses, 500, undefined, 50);

      expect(netPay).toBe(4950); // 5000 + 500 (bonus) - 500 (deductions) - 50 (uif)
    });

    it('should handle getCurrentUserName with null user', () => {
      // Set payslipDataSubject to have no payslipUser
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: undefined, allUsers: [mockUser] });
      spyOn(component as any, 'getCurrentUser').and.returnValue(null);

      const userName = component.getCurrentUserName();

      expect(userName).toBe('Unknown User');
    });

    it('should handle getCurrentUserEmail with null user', () => {
      // Set payslipDataSubject to have no payslipUser
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: undefined, allUsers: [mockUser] });
      spyOn(component as any, 'getCurrentUser').and.returnValue(null);

      const userEmail = component.getCurrentUserEmail();

      expect(userEmail).toBe('unknown@tutorcore.com');
    });

    it('should handle isCurrentUserAdmin with null user', () => {
      spyOn(component as any, 'getCurrentUser').and.returnValue(null);

      const isAdmin = component.isCurrentUserAdmin();

      expect(isAdmin).toBe(false);
    });

    it('should return false for canEditPayslip when status is not DRAFT', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };

      const canEdit = component.canEditPayslip(approvedPayslip);

      expect(canEdit).toBe(false);
    });

    it('should return false for canEditPayslip when status is PAID', () => {
      const paidPayslip = { ...mockPayslip, status: EPayslipStatus.PAID };

      const canEdit = component.canEditPayslip(paidPayslip);

      expect(canEdit).toBe(false);
    });

    it('should refresh data when openQueryDialog is closed with result', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      const mockDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      spyOn(component, 'loadPayslipData');

      component.openQueryDialog(mockPayslip.earnings[0], 'earning', 0);

      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should not refresh data when openQueryDialog is closed without result', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      const mockDialogRef = { afterClosed: () => of(false) };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      spyOn(component, 'loadPayslipData');

      component.openQueryDialog(mockPayslip.earnings[0], 'earning', 0);

      expect(component.loadPayslipData).not.toHaveBeenCalled();
    });

    it('should call getQueryDetails with itemIndex in openQueryDialog', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      const mockDialogRef = { afterClosed: () => of(false) };
      mockDialog.open.and.returnValue(mockDialogRef as any);
      spyOn(component, 'getQueryDetails');

      component.openQueryDialog(mockPayslip.earnings[0], 'earning', 0);

      expect(component.getQueryDetails).toHaveBeenCalledWith(mockPayslip.earnings[0].description, 'earning', 0);
    });

    it('should handle hasQuery when payslip has no notes property', () => {
      const payslipWithoutNotes = { ...mockPayslip };
      delete (payslipWithoutNotes as any).notes;
      component['payslipDataSubject'].next({ payslip: payslipWithoutNotes as any, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test', 'earning', 0);

      expect(hasQuery).toBe(false);
    });

    it('should handle getQueryDetails when payslip has no notes property', () => {
      const payslipWithoutNotes = { ...mockPayslip };
      delete (payslipWithoutNotes as any).notes;
      component['payslipDataSubject'].next({ payslip: payslipWithoutNotes as any, payslipUser: mockUser, allUsers: [mockUser] });

      const queryDetails = component.getQueryDetails('Test', 'earning', 0);

      expect(queryDetails).toBeUndefined();
    });

    it('should return false for hasQuery when no payslip data', () => {
      component['payslipDataSubject'].next(null);

      const hasQuery = component.hasQuery('Test', 'earning', 0);

      expect(hasQuery).toBe(false);
    });

    it('should return undefined for getQueryDetails when no payslip data', () => {
      component['payslipDataSubject'].next(null);

      const queryDetails = component.getQueryDetails('Test', 'earning', 0);

      expect(queryDetails).toBeUndefined();
    });

    it('should return true for hasQuery with resolved=false note', () => {
      const payslipWithNote = {
        ...mockPayslip,
        notes: [{ itemId: 'earning-0', resolved: false, note: 'Test' }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithNote, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test', 'earning', 0);

      expect(hasQuery).toBe(true);
    });

    it('should return false for hasQuery with resolved=true note', () => {
      const payslipWithNote = {
        ...mockPayslip,
        notes: [{ itemId: 'earning-0', resolved: true, note: 'Test' }]
      };
      component['payslipDataSubject'].next({ payslip: payslipWithNote, payslipUser: mockUser, allUsers: [mockUser] });

      const hasQuery = component.hasQuery('Test', 'earning', 0);

      expect(hasQuery).toBe(false);
    });

    it('should not add dummy data when no current data', () => {
      component['payslipDataSubject'].next(null);

      component.addDummyData();

      expect(mockSnackBarService.showSuccess).not.toHaveBeenCalled();
    });

    it('should handle error when removing deduction', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      mockPayslipService.removeDeduction.and.returnValue(throwError(() => new Error('API Error')));

      component.removeDeduction(0);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to remove deduction. Please try again.');
    });

    it('should handle error when adding misc earning', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      mockPayslipService.addMiscEarning.and.returnValue(throwError(() => new Error('API Error')));

      component.addNewMiscEarning();

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to add misc earning. Please try again.');
    });

    it('should add dummy data successfully', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      spyOn(component, 'getDummyEarnings').and.returnValue([]);
      spyOn(component, 'getDummyBonuses').and.returnValue([]);
      spyOn(component, 'getDummyMiscEarnings').and.returnValue([]);
      spyOn(component, 'getDummyDeductions').and.returnValue([]);

      component.addDummyData();

      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Dummy data added for UI testing!');
    });
  });

  describe('Helper Methods', () => {
    it('should return correct dummy earnings', () => {
      const earnings = component.getDummyEarnings();

      expect(earnings.length).toBe(4);
      expect(earnings[0].description).toBe('Individual Tutoring - Mathematics');
    });

    it('should return correct dummy bonuses', () => {
      const bonuses = component.getDummyBonuses();

      expect(bonuses.length).toBe(3);
      expect(bonuses[0].description).toBe('Performance Bonus - High Student Ratings');
    });

    it('should return correct dummy misc earnings', () => {
      const miscEarnings = component.getDummyMiscEarnings();

      expect(miscEarnings.length).toBe(2);
      expect(miscEarnings[0].description).toBe('Overtime Bonus');
    });

    it('should return correct dummy deductions', () => {
      const deductions = component.getDummyDeductions();

      expect(deductions.length).toBe(4);
      expect(deductions[0].description).toBe('Equipment Usage Fee');
    });

    it('should return available bonuses', () => {
      const bonuses = component.getAvailableBonuses();

      expect(bonuses.length).toBe(7);
      expect(bonuses[0].id).toBe('performance');
    });

    it('should return current date', () => {
      const date = component.getCurrentDate();

      expect(date).toBeInstanceOf(Date);
    });

    it('should return track by index', () => {
      const index = component.trackByIndex(5);

      expect(index).toBe(5);
    });

    it('should calculate total income correctly', () => {
      const totalIncome = component.getTotalIncome(mockPayslip);

      expect(totalIncome).toBeGreaterThan(0);
    });

    it('should calculate current net pay correctly', () => {
      const netPay = component.getCurrentNetPay(mockPayslip);

      expect(netPay).toBeDefined();
    });

    it('should edit deduction and set editing state', () => {
      const deduction = { description: 'Test', amount: 100 };

      component.editDeduction(0, deduction);

      expect(component.editingDeduction).toBe(0);
      expect(component.editingDeductionData).toEqual(deduction);
    });

    it('should edit misc earning and set editing state', () => {
      const earning = { description: 'Test', amount: 200 };

      component.editMiscEarning(0, earning);

      expect(component.editingMiscEarning).toBe(0);
      expect(component.editingMiscEarningData).toEqual(earning);
    });

    it('should cancel deduction edit', () => {
      component.editingDeduction = 5;
      component.editingDeductionData = { description: 'Test', amount: 100 };

      component.cancelDeductionEdit();

      expect(component.editingDeduction).toBeNull();
      expect(component.editingDeductionData).toEqual({ description: '', amount: 0 });
    });

    it('should cancel misc earning edit', () => {
      component.editingMiscEarning = 5;
      component.editingMiscEarningData = { description: 'Test', amount: 100 };

      component.cancelMiscEarningEdit();

      expect(component.editingMiscEarning).toBeNull();
      expect(component.editingMiscEarningData).toEqual({ description: '', amount: 0 });
    });
  });

  describe('Admin Methods', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
    });

    it('should mark query as handled', () => {
      const queryPayslip = { ...mockPayslip, status: EPayslipStatus.QUERY };
      mockPayslipService.updatePayslipStatus.and.returnValue(of(queryPayslip));
      spyOn(component, 'loadPayslipData');

      component.markQueryAsHandled(queryPayslip);

      expect(mockPayslipService.updatePayslipStatus).toHaveBeenCalledWith(queryPayslip._id, EPayslipStatus.QUERY_HANDLED);
      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should handle error when marking query as handled', () => {
      const queryPayslip = { ...mockPayslip, status: EPayslipStatus.QUERY };
      mockPayslipService.updatePayslipStatus.and.returnValue(throwError(() => new Error('API Error')));

      component.markQueryAsHandled(queryPayslip);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to mark query as handled. Please try again.');
    });

    it('should approve payslip', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      (mockPayslipService as any).approvePayslip = jasmine.createSpy('approvePayslip').and.returnValue(of(approvedPayslip));
      spyOn(component, 'loadPayslipData');

      component.approvePayslip(approvedPayslip);

      expect((mockPayslipService as any).approvePayslip).toHaveBeenCalledWith(approvedPayslip._id);
      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should handle error when approving payslip', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      (mockPayslipService as any).approvePayslip = jasmine.createSpy('approvePayslip').and.returnValue(throwError(() => new Error('API Error')));

      component.approvePayslip(approvedPayslip);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to approve payslip. Please try again.');
    });

    it('should reject payslip', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      (mockPayslipService as any).rejectPayslip = jasmine.createSpy('rejectPayslip').and.returnValue(of(mockPayslip));
      spyOn(component, 'loadPayslipData');

      component.rejectPayslip(approvedPayslip);

      expect((mockPayslipService as any).rejectPayslip).toHaveBeenCalledWith(approvedPayslip._id);
      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should handle error when rejecting payslip', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      (mockPayslipService as any).rejectPayslip = jasmine.createSpy('rejectPayslip').and.returnValue(throwError(() => new Error('API Error')));

      component.rejectPayslip(approvedPayslip);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to reject payslip. Please try again.');
    });

    it('should mark payslip as paid', () => {
      const lockedPayslip = { ...mockPayslip, status: EPayslipStatus.LOCKED };
      (mockPayslipService as any).markPayslipAsPaid = jasmine.createSpy('markPayslipAsPaid').and.returnValue(of(lockedPayslip));
      spyOn(component, 'loadPayslipData');

      component.markAsPaid(lockedPayslip);

      expect((mockPayslipService as any).markPayslipAsPaid).toHaveBeenCalledWith(lockedPayslip._id);
      expect(component.loadPayslipData).toHaveBeenCalled();
    });

    it('should handle error when marking as paid', () => {
      const lockedPayslip = { ...mockPayslip, status: EPayslipStatus.LOCKED };
      (mockPayslipService as any).markPayslipAsPaid = jasmine.createSpy('markPayslipAsPaid').and.returnValue(throwError(() => new Error('API Error')));

      component.markAsPaid(lockedPayslip);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to mark payslip as paid. Please try again.');
    });

    it('should return true for canMarkAsHandled when payslip is in QUERY status', () => {
      const queryPayslip = { ...mockPayslip, status: EPayslipStatus.QUERY };
      spyOn(component, 'isAdmin').and.returnValue(true);

      const canMark = component.canMarkAsHandled(queryPayslip);

      expect(canMark).toBe(true);
    });

    it('should return true for canApprove when payslip is STAFF_APPROVED', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      spyOn(component, 'isAdmin').and.returnValue(true);

      const canApprove = component.canApprove(approvedPayslip);

      expect(canApprove).toBe(true);
    });

    it('should return true for canReject when payslip is STAFF_APPROVED', () => {
      const approvedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };
      spyOn(component, 'isAdmin').and.returnValue(true);

      const canReject = component.canReject(approvedPayslip);

      expect(canReject).toBe(true);
    });

    it('should return true for canMarkAsPaid when payslip is LOCKED', () => {
      const lockedPayslip = { ...mockPayslip, status: EPayslipStatus.LOCKED };
      spyOn(component, 'isAdmin').and.returnValue(true);

      const canMarkAsPaid = component.canMarkAsPaid(lockedPayslip);

      expect(canMarkAsPaid).toBe(true);
    });

    it('should return correct history status label', () => {
      expect(component.getHistoryStatusLabel(EPayslipStatus.DRAFT)).toBe('Draft');
      expect(component.getHistoryStatusLabel(EPayslipStatus.QUERY)).toBe('Query Submitted');
      expect(component.getHistoryStatusLabel(EPayslipStatus.QUERY_HANDLED)).toBe('Query Handled');
      expect(component.getHistoryStatusLabel(EPayslipStatus.STAFF_APPROVED)).toBe('Staff Approved');
      expect(component.getHistoryStatusLabel(EPayslipStatus.LOCKED)).toBe('Approved (Locked)');
      expect(component.getHistoryStatusLabel(EPayslipStatus.PAID)).toBe('Paid');
      expect(component.getHistoryStatusLabel('Unknown')).toBe('Unknown');
    });

    it('should return history user name from allUsers', () => {
      const userName = component.getHistoryUserName('user1');

      expect(userName).toBe('Test User');
    });

    it('should return Unknown User when user not found in allUsers', () => {
      const userName = component.getHistoryUserName('nonexistent');

      expect(userName).toBe('Unknown User');
    });

    it('should return empty string when no allUsers data', () => {
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: undefined });

      const userName = component.getHistoryUserName('user1');

      expect(userName).toBe('');
    });
  });

  describe('Permission and Status Checks', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
    });

    it('should return false for canManageItems when payslip is LOCKED', () => {
      const lockedPayslip = { ...mockPayslip, status: EPayslipStatus.LOCKED };

      const canManage = component.canManageItems(lockedPayslip);

      expect(canManage).toBe(false);
    });

    it('should return false for canManageItems when payslip is PAID', () => {
      const paidPayslip = { ...mockPayslip, status: EPayslipStatus.PAID };

      const canManage = component.canManageItems(paidPayslip);

      expect(canManage).toBe(false);
    });

    it('should return true for canManageItems when admin', () => {
      spyOn(component, 'isAdmin').and.returnValue(true);

      const canManage = component.canManageItems(mockPayslip);

      expect(canManage).toBe(true);
    });

    it('should return true for canManageItems when own payslip in DRAFT status', () => {
      spyOn(component, 'isAdmin').and.returnValue(false);
      spyOn(component, 'isOwnPayslip').and.returnValue(true);
      const draftPayslip = { ...mockPayslip, status: EPayslipStatus.DRAFT };

      const canManage = component.canManageItems(draftPayslip);

      expect(canManage).toBe(true);
    });

    it('should return true for canManageItems when own payslip in QUERY_HANDLED status', () => {
      spyOn(component, 'isAdmin').and.returnValue(false);
      spyOn(component, 'isOwnPayslip').and.returnValue(true);
      const queryHandledPayslip = { ...mockPayslip, status: EPayslipStatus.QUERY_HANDLED };

      const canManage = component.canManageItems(queryHandledPayslip);

      expect(canManage).toBe(true);
    });

    it('should return false for canManageItems when own payslip in other status', () => {
      spyOn(component, 'isAdmin').and.returnValue(false);
      spyOn(component, 'isOwnPayslip').and.returnValue(true);
      const staffApprovedPayslip = { ...mockPayslip, status: EPayslipStatus.STAFF_APPROVED };

      const canManage = component.canManageItems(staffApprovedPayslip);

      expect(canManage).toBe(false);
    });

    it('should return false for canQueryPayslip when payslip is LOCKED', () => {
      const lockedPayslip = { ...mockPayslip, status: EPayslipStatus.LOCKED };

      const canQuery = component.canQueryPayslip(lockedPayslip);

      expect(canQuery).toBe(false);
    });

    it('should return false for canQueryPayslip when payslip is PAID', () => {
      const paidPayslip = { ...mockPayslip, status: EPayslipStatus.PAID };

      const canQuery = component.canQueryPayslip(paidPayslip);

      expect(canQuery).toBe(false);
    });

    it('should return true for canQueryPayslip when payslip is DRAFT', () => {
      const draftPayslip = { ...mockPayslip, status: EPayslipStatus.DRAFT };

      const canQuery = component.canQueryPayslip(draftPayslip);

      expect(canQuery).toBe(true);
    });

    it('should return false for isOwnPayslip when user is null', () => {
      spyOn(component as any, 'getCurrentUser').and.returnValue(null);

      const isOwn = component.isOwnPayslip(mockPayslip);

      expect(isOwn).toBe(false);
    });

    it('should return true for isOwnPayslip when user matches payslip userId', () => {
      const isOwn = component.isOwnPayslip(mockPayslip);

      expect(isOwn).toBe(true);
    });
  });

  describe('Earning Edit Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      (mockPayslipService as any).updateEarning = jasmine.createSpy('updateEarning').and.returnValue(of(mockPayslip));
    });

    it('should not save earning edit when no current data', () => {
      component['payslipDataSubject'].next(null);
      component.editingEarning = 0;

      component.saveEarningEdit(0);

      expect((mockPayslipService as any).updateEarning).not.toHaveBeenCalled();
    });

    it('should not save earning edit when editingEarning is null', () => {
      component.editingEarning = null;

      component.saveEarningEdit(0);

      expect((mockPayslipService as any).updateEarning).not.toHaveBeenCalled();
    });

    it('should not save earning edit when index is negative', () => {
      component.editingEarning = 0;

      component.saveEarningEdit(-1);

      expect((mockPayslipService as any).updateEarning).not.toHaveBeenCalled();
    });

    it('should not save earning edit when index exceeds array length', () => {
      component.editingEarning = 0;

      component.saveEarningEdit(999);

      expect((mockPayslipService as any).updateEarning).not.toHaveBeenCalled();
    });

    it('should save earning edit successfully', () => {
      component.editingEarning = 0;
      component.editingEarningData = {
        description: 'Updated',
        baseRate: 100,
        hours: 10,
        rate: 150,
        date: '2024-09-20'
      };

      component.saveEarningEdit(0);

      expect((mockPayslipService as any).updateEarning).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Earning updated successfully');
    });

    it('should handle error when saving earning edit', () => {
      (mockPayslipService as any).updateEarning.and.returnValue(throwError(() => new Error('API Error')));
      component.editingEarning = 0;
      component.editingEarningData = {
        description: 'Updated',
        baseRate: 100,
        hours: 10,
        rate: 150,
        date: '2024-09-20'
      };

      component.saveEarningEdit(0);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to update earning. Please try again.');
    });

    it('should set edit state when editing earning', () => {
      const earning = mockPayslip.earnings[0];

      component.editEarning(0, earning);

      expect(component.editingEarning).toBe(0);
      expect(component.editingEarningData).toEqual({
        description: earning.description,
        baseRate: earning.baseRate,
        hours: earning.hours,
        rate: earning.rate,
        date: earning.date
      });
    });

    it('should cancel earning edit', () => {
      component.editingEarning = 5;
      component.editingEarningData = { description: 'Test', baseRate: 50, hours: 10, rate: 100, date: '2024-01-01' };

      component.cancelEarningEdit();

      expect(component.editingEarning).toBeNull();
      expect(component.editingEarningData).toEqual({ description: '', baseRate: 0, hours: 0, rate: 0, date: '' });
    });

    it('should get editing earning total', () => {
      component.editingEarningData = { description: 'Test', baseRate: 50, hours: 10, rate: 100, date: '2024-01-01' };

      const total = component.getEditingEarningTotal();

      expect(total).toBe(1050); // baseRate + (hours * rate) = 50 + (10 * 100)
    });
  });

  describe('Bonus Edit Management', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
      (mockPayslipService as any).updateBonus = jasmine.createSpy('updateBonus').and.returnValue(of(mockPayslip));
    });

    it('should not save bonus edit when no current data', () => {
      component['payslipDataSubject'].next(null);
      component.editingBonus = 0;

      component.saveBonusEdit(0);

      expect((mockPayslipService as any).updateBonus).not.toHaveBeenCalled();
    });

    it('should not save bonus edit when editingBonus is null', () => {
      component.editingBonus = null;

      component.saveBonusEdit(0);

      expect((mockPayslipService as any).updateBonus).not.toHaveBeenCalled();
    });

    it('should not save bonus edit when bonuses array is missing', () => {
      const payslipNoBonuses = { ...mockPayslip, bonuses: undefined };
      component['payslipDataSubject'].next({ payslip: payslipNoBonuses as any, payslipUser: mockUser, allUsers: [mockUser] });
      component.editingBonus = 0;

      component.saveBonusEdit(0);

      expect((mockPayslipService as any).updateBonus).not.toHaveBeenCalled();
    });

    it('should not save bonus edit when index is negative', () => {
      component.editingBonus = 0;

      component.saveBonusEdit(-1);

      expect((mockPayslipService as any).updateBonus).not.toHaveBeenCalled();
    });

    it('should not save bonus edit when index exceeds array length', () => {
      component.editingBonus = 0;

      component.saveBonusEdit(999);

      expect((mockPayslipService as any).updateBonus).not.toHaveBeenCalled();
    });

    it('should save bonus edit successfully', () => {
      component.editingBonus = 0;
      component.editingBonusData = { description: 'Updated Bonus', amount: 600 };

      component.saveBonusEdit(0);

      expect((mockPayslipService as any).updateBonus).toHaveBeenCalled();
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Bonus updated successfully');
    });

    it('should handle error when saving bonus edit', () => {
      (mockPayslipService as any).updateBonus.and.returnValue(throwError(() => new Error('API Error')));
      component.editingBonus = 0;
      component.editingBonusData = { description: 'Updated Bonus', amount: 600 };

      component.saveBonusEdit(0);

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to update bonus. Please try again.');
    });

    it('should set edit state when editing bonus', () => {
      const bonus = mockPayslip.bonuses[0];

      component.editBonus(0, bonus);

      expect(component.editingBonus).toBe(0);
      expect(component.editingBonusData).toEqual(bonus);
    });

    it('should cancel bonus edit', () => {
      component.editingBonus = 5;
      component.editingBonusData = { description: 'Test', amount: 100 };

      component.cancelBonusEdit();

      expect(component.editingBonus).toBeNull();
      expect(component.editingBonusData).toEqual({ description: '', amount: 0 });
    });
  });

  describe('PDF Generation Edge Cases', () => {
    beforeEach(() => {
      fixture.detectChanges();
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [mockUser] });
    });

    it('should handle payslip with no bonuses in PDF', () => {
      const payslipNoBonuses = { ...mockPayslip, bonuses: [] };

      expect(() => component.downloadPDF(payslipNoBonuses)).not.toThrow();
    });

    it('should handle payslip with no misc earnings in PDF', () => {
      const payslipNoMiscEarnings = { ...mockPayslip, miscEarnings: [] };

      expect(() => component.downloadPDF(payslipNoMiscEarnings)).not.toThrow();
    });

    it('should handle payslip with no deductions in PDF', () => {
      const payslipNoDeductions = { ...mockPayslip, deductions: [] };

      expect(() => component.downloadPDF(payslipNoDeductions)).not.toThrow();
    });

    it('should handle earnings with undefined values in PDF', () => {
      const payslipWithUndefined = {
        ...mockPayslip,
        earnings: [
          { description: 'Test', baseRate: undefined, hours: undefined, rate: undefined, total: undefined, date: '2024-01-01' } as any
        ]
      };

      expect(() => component.downloadPDF(payslipWithUndefined)).not.toThrow();
    });

    it('should handle bonuses with undefined amount in PDF', () => {
      const payslipWithUndefined = {
        ...mockPayslip,
        bonuses: [{ description: 'Test', amount: undefined } as any]
      };

      expect(() => component.downloadPDF(payslipWithUndefined)).not.toThrow();
    });

    it('should handle deductions with undefined amount in PDF', () => {
      const payslipWithUndefined = {
        ...mockPayslip,
        deductions: [{ description: 'Test', amount: undefined } as any]
      };

      expect(() => component.downloadPDF(payslipWithUndefined)).not.toThrow();
    });

    it('should handle misc earnings with undefined amount in PDF', () => {
      const payslipWithUndefined = {
        ...mockPayslip,
        miscEarnings: [{ description: 'Test', amount: undefined } as any]
      };

      expect(() => component.downloadPDF(payslipWithUndefined)).not.toThrow();
    });

    it('should handle payslip with undefined grossEarnings in PDF', () => {
      const payslipUndefinedGross = { ...mockPayslip, grossEarnings: undefined } as any;

      expect(() => component.downloadPDF(payslipUndefinedGross)).not.toThrow();
    });

    it('should handle payslip with undefined totalDeductions in PDF', () => {
      const payslipUndefinedDeductions = { ...mockPayslip, totalDeductions: undefined } as any;

      expect(() => component.downloadPDF(payslipUndefinedDeductions)).not.toThrow();
    });

    it('should handle payslip with undefined paye and uif in PDF', () => {
      const payslipUndefinedTaxes = { ...mockPayslip, paye: undefined, uif: undefined } as any;

      expect(() => component.downloadPDF(payslipUndefinedTaxes)).not.toThrow();
    });

    it('should handle payslip with undefined payPeriod in PDF', () => {
      const payslipUndefinedPeriod = { ...mockPayslip, payPeriod: undefined } as any;

      expect(() => component.downloadPDF(payslipUndefinedPeriod)).not.toThrow();
    });
  });

  describe('Navigation Methods', () => {
    it('should navigate to admin payslips when on admin route', () => {
      const mockRouter = TestBed.inject(Router) as any;
      spyOn(mockRouter, 'navigate');
      Object.defineProperty(mockRouter, 'url', { value: '/dashboard/admin/payslips/payslip1' });

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/admin/payslips']);
    });

    it('should navigate to staff payslips when on staff route', () => {
      const mockRouter = TestBed.inject(Router) as any;
      spyOn(mockRouter, 'navigate');
      Object.defineProperty(mockRouter, 'url', { value: '/dashboard/payslips/payslip1' });

      component.goBack();

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/payslips']);
    });

    it('should return admin label when on admin route', () => {
      const mockRouter = TestBed.inject(Router) as any;
      Object.defineProperty(mockRouter, 'url', { value: '/dashboard/admin/payslips/payslip1' });

      const label = component.getBackButtonLabel();

      expect(label).toBe('Back to Payslip Management');
    });

    it('should return staff label when on staff route', () => {
      const mockRouter = TestBed.inject(Router) as any;
      Object.defineProperty(mockRouter, 'url', { value: '/dashboard/payslips/payslip1' });

      const label = component.getBackButtonLabel();

      expect(label).toBe('Back to Payslip History');
    });
  });

  describe('User Information Fallback', () => {
    it('should fallback to current user email when payslip user has no email', () => {
      const userNoEmail = { ...mockUser, email: undefined };
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: userNoEmail as any, allUsers: [mockUser] });

      const email = component.getCurrentUserEmail();

      expect(email).toBe('unknown@tutorcore.com');
    });

    it('should fallback to current user name when payslip user has no displayName', () => {
      const userNoName = { ...mockUser, displayName: undefined };
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: userNoName as any, allUsers: [mockUser] });

      const name = component.getCurrentUserName();

      expect(name).toBe('Unknown User');
    });

    it('should return user email from allUsers when displayName is missing', () => {
      const userNoDisplayName = { ...mockUser, displayName: undefined } as any;
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [userNoDisplayName] });

      const userName = component.getHistoryUserName('user1');

      expect(userName).toBe('test@example.com');
    });

    it('should return Unknown User when both displayName and email are missing', () => {
      const userNoInfo = { ...mockUser, displayName: undefined, email: undefined } as any;
      component['payslipDataSubject'].next({ payslip: mockPayslip, payslipUser: mockUser, allUsers: [userNoInfo] });

      const userName = component.getHistoryUserName('user1');

      expect(userName).toBe('Unknown User');
    });
  });


});

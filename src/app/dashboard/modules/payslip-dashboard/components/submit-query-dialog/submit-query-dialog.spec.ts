import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';

import { SubmitQueryDialogComponent } from './submit-query-dialog';
import { PayslipService } from '../../../../../services/payslip-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { EPayslipStatus } from '../../../../../models/enums/payslip-status.enum';
import { IPayslip, INote } from '../../../../../models/interfaces/IPayslip.interface';

describe('SubmitQueryDialogComponent', () => {
  let component: SubmitQueryDialogComponent;
  let fixture: ComponentFixture<SubmitQueryDialogComponent>;
  let mockPayslipService: jasmine.SpyObj<PayslipService>;
  let mockSnackBarService: jasmine.SpyObj<SnackBarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<SubmitQueryDialogComponent>>;

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
      },
      {
        description: 'Tutorial Sessions',
        baseRate: 40,
        hours: 10,
        rate: 120,
        total: 1240,
        date: '2024-09-16'
      }
    ],
    bonuses: [
      { description: 'Performance Bonus', amount: 500 },
      { description: 'Referral Bonus', amount: 200 }
    ],
    miscEarnings: [
      { description: 'Overtime', amount: 250 }
    ],
    deductions: [
      { description: 'Equipment Fee', amount: 150 },
      { description: 'Platform Fee', amount: 100 }
    ],
    notes: [],
    history: []
  };

  const mockExistingQuery: INote = {
    _id: 'query1',
    itemId: 'earning-0',
    note: 'Existing query note',
    resolved: false
  };

  const mockDialogData = {
    payslip: mockPayslip,
    selectedItem: { description: 'Teaching Hours', amount: 3050 },
    itemType: 'earning' as const,
    itemIndex: 0
  };

  beforeEach(async () => {
    const payslipServiceSpy = jasmine.createSpyObj('PayslipService', [
      'addQuery',
      'updateQuery',
      'deleteQuery',
      'resolveQuery'
    ]);
    const snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', [
      'showSuccess',
      'showError'
    ]);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [SubmitQueryDialogComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: PayslipService, useValue: payslipServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubmitQueryDialogComponent);
    component = fixture.componentInstance;

    mockPayslipService = TestBed.inject(PayslipService) as jasmine.SpyObj<PayslipService>;
    mockSnackBarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<SubmitQueryDialogComponent>>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize form with preselected item data', () => {
    expect(component.queryForm.get('itemId')?.value).toBe('earning-0');
    expect(component.selectedItemName).toBe('Teaching Hours');
  });

  it('should populate queryable items from payslip data', () => {
    expect(component.queryableItems.length).toBe(7); // 2 earnings + 2 bonuses + 1 misc earning + 2 deductions + 1 general = 7

    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'earning-0', viewValue: 'Earning: Teaching Hours' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'earning-1', viewValue: 'Earning: Tutorial Sessions' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'bonus-0', viewValue: 'Bonus: Performance Bonus' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'bonus-1', viewValue: 'Bonus: Referral Bonus' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'deduction-0', viewValue: 'Deduction: Equipment Fee' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'deduction-1', viewValue: 'Deduction: Platform Fee' })
    );
    expect(component.queryableItems).toContain(
      jasmine.objectContaining({ id: 'general-payslip', viewValue: 'General Payslip Query' })
    );
  });

  describe('Form validation', () => {
    it('should require itemId when not general query', () => {
      component.queryForm.patchValue({ itemId: '', note: 'Test note' });
      expect(component.queryForm.invalid).toBe(true);
    });

    it('should require note', () => {
      component.queryForm.patchValue({ itemId: 'earning-0', note: '' });
      expect(component.queryForm.invalid).toBe(true);
    });

    it('should be valid with both itemId and note', () => {
      component.queryForm.patchValue({ itemId: 'earning-0', note: 'Test note' });
      expect(component.queryForm.valid).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('should not submit when form is invalid', () => {
      component.queryForm.patchValue({ itemId: '', note: '' });

      component.onSubmit();

      expect(mockPayslipService.addQuery).not.toHaveBeenCalled();
      expect(mockPayslipService.updateQuery).not.toHaveBeenCalled();
    });

    it('should create new query when not in edit mode', () => {
      component.queryForm.patchValue({ itemId: 'earning-0', note: 'New query note' });
      component.isEditMode = false;
      mockPayslipService.addQuery.and.returnValue(of(mockPayslip));

      component.onSubmit();

      expect(mockPayslipService.addQuery).toHaveBeenCalledWith(
        mockPayslip._id,
        'earning-0',
        'New query note'
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Query submitted successfully.');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should update existing query when in edit mode', () => {
      component.queryForm.patchValue({ itemId: 'earning-0', note: 'Updated query note' });
      component.isEditMode = true;
      component.data.existingQuery = mockExistingQuery;
      mockPayslipService.updateQuery.and.returnValue(of(mockPayslip));

      component.onSubmit();

      expect(mockPayslipService.updateQuery).toHaveBeenCalledWith(
        mockPayslip._id,
        mockExistingQuery._id!,
        'Updated query note'
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Query updated successfully.');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without result', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });

  describe('onDelete', () => {
    it('should delete query when existing query has ID', () => {
      component.data.existingQuery = mockExistingQuery;
      mockPayslipService.deleteQuery.and.returnValue(of(mockPayslip));

      component.onDelete();

      expect(mockPayslipService.deleteQuery).toHaveBeenCalledWith(
        mockPayslip._id,
        mockExistingQuery._id!
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Query deleted successfully.');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should not delete when existing query has no ID', () => {
      component.data.existingQuery = { ...mockExistingQuery, _id: undefined };

      component.onDelete();

      expect(mockPayslipService.deleteQuery).not.toHaveBeenCalled();
    });
  });

  describe('onResolve', () => {
    it('should resolve query when existing query has ID', () => {
      component.data.existingQuery = mockExistingQuery;
      mockPayslipService.resolveQuery.and.returnValue(of(mockPayslip));

      component.onResolve();

      expect(mockPayslipService.resolveQuery).toHaveBeenCalledWith(
        mockPayslip._id,
        mockExistingQuery._id!,
        'Query marked as resolved by user.'
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith('Query marked as resolved.');
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should not resolve when existing query has no ID', () => {
      component.data.existingQuery = { ...mockExistingQuery, _id: undefined };

      component.onResolve();

      expect(mockPayslipService.resolveQuery).not.toHaveBeenCalled();
    });
  });

  describe('Edit mode initialization', () => {
    it('should initialize in edit mode when existing query is provided', async () => {
      const editModeData = {
        ...mockDialogData,
        existingQuery: mockExistingQuery
      };

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SubmitQueryDialogComponent, ReactiveFormsModule, NoopAnimationsModule],
        providers: [
          { provide: PayslipService, useValue: mockPayslipService },
          { provide: SnackBarService, useValue: mockSnackBarService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: editModeData }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(SubmitQueryDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.isEditMode).toBe(true);
      expect(component.queryForm.get('note')?.value).toBe('Existing query note');
    });
  });

  describe('General query type', () => {
    it('should handle general query type without item selection', async () => {
      const generalQueryData = {
        payslip: mockPayslip,
        itemType: 'general' as const
      };

      TestBed.resetTestingModule();
      await TestBed.configureTestingModule({
        imports: [SubmitQueryDialogComponent, ReactiveFormsModule, NoopAnimationsModule],
        providers: [
          { provide: PayslipService, useValue: mockPayslipService },
          { provide: SnackBarService, useValue: mockSnackBarService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: generalQueryData }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(SubmitQueryDialogComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.queryForm.get('itemId')?.value).toBe('');
      expect(component.selectedItemName).toBe('');
    });
  });
});
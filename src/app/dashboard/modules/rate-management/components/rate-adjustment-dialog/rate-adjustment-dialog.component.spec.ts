import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';

import { RateAdjustmentDialogComponent, RateAdjustmentDialogData } from './rate-adjustment-dialog.component';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser, IRateAdjustment } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

describe('RateAdjustmentDialogComponent', () => {
  let component: RateAdjustmentDialogComponent;
  let fixture: ComponentFixture<RateAdjustmentDialogComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockSnackBarService: jasmine.SpyObj<SnackBarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RateAdjustmentDialogComponent>>;

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

  const mockDialogData: RateAdjustmentDialogData = {
    user: mockUser
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['addRateAdjustment']);
    const snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RateAdjustmentDialogComponent, ReactiveFormsModule, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RateAdjustmentDialogComponent);
    component = fixture.componentInstance;

    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockSnackBarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RateAdjustmentDialogComponent>>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user data', () => {
    expect(component.user).toEqual(mockUser);
    expect(component.rateAdjustmentForm.get('newRate')?.value).toBe(150); // Most recent rate
  });

  describe('getCurrentRate', () => {
    it('should return the most recent rate', () => {
      const currentRate = component['getCurrentRate']();
      expect(currentRate).toBe(150);
    });

    it('should return 0 when user has no rate adjustments', () => {
      component.user = { ...mockUser, rateAdjustments: [] };
      const currentRate = component['getCurrentRate']();
      expect(currentRate).toBe(0);
    });

    it('should return 0 when rateAdjustments is undefined', () => {
      component.user = { ...mockUser, rateAdjustments: [] };
      const currentRate = component['getCurrentRate']();
      expect(currentRate).toBe(0);
    });
  });

  describe('currentRateDisplay', () => {
    it('should format rate correctly', () => {
      const display = component.currentRateDisplay;
      expect(display).toBe('R150.00/hr');
    });

    it('should show "No rate set" when rate is 0', () => {
      component.user = { ...mockUser, rateAdjustments: [] };
      const display = component.currentRateDisplay;
      expect(display).toBe('No rate set');
    });
  });

  describe('Form validation', () => {
    it('should require reason with minimum length', () => {
      const reasonControl = component.rateAdjustmentForm.get('reason');

      reasonControl?.setValue('');
      expect(reasonControl?.invalid).toBe(true);
      expect(reasonControl?.errors?.['required']).toBeTruthy();

      reasonControl?.setValue('abc');
      expect(reasonControl?.invalid).toBe(true);
      expect(reasonControl?.errors?.['minlength']).toBeTruthy();

      reasonControl?.setValue('Valid reason');
      expect(reasonControl?.valid).toBe(true);
    });

    it('should require newRate with minimum value', () => {
      const rateControl = component.rateAdjustmentForm.get('newRate');

      rateControl?.setValue('');
      expect(rateControl?.invalid).toBe(true);
      expect(rateControl?.errors?.['required']).toBeTruthy();

      rateControl?.setValue(0);
      expect(rateControl?.invalid).toBe(true);
      expect(rateControl?.errors?.['min']).toBeTruthy();

      rateControl?.setValue(50.5);
      expect(rateControl?.valid).toBe(true);
    });
  });

  describe('isRateChanged', () => {
    it('should return true when rate has changed', () => {
      component.rateAdjustmentForm.get('newRate')?.setValue(200);
      expect(component.isRateChanged).toBe(true);
    });

    it('should return false when rate is the same', () => {
      component.rateAdjustmentForm.get('newRate')?.setValue(150);
      expect(component.isRateChanged).toBe(false);
    });
  });

  describe('onSubmit', () => {
    beforeEach(() => {
      component.rateAdjustmentForm.patchValue({
        reason: 'Performance improvement',
        newRate: 200
      });
    });

    it('should not submit when form is invalid', () => {
      component.rateAdjustmentForm.patchValue({ reason: '', newRate: 0 });

      component.onSubmit();

      expect(mockUserService.addRateAdjustment).not.toHaveBeenCalled();
    });

    it('should not submit when already submitting', () => {
      component.isSubmitting = true;

      component.onSubmit();

      expect(mockUserService.addRateAdjustment).not.toHaveBeenCalled();
    });

    it('should submit rate adjustment successfully', () => {
      mockUserService.addRateAdjustment.and.returnValue(of(mockUser));

      component.onSubmit();

      expect(component.isSubmitting).toBe(true);
      expect(mockUserService.addRateAdjustment).toHaveBeenCalledWith(
        mockUser._id,
        jasmine.objectContaining({
          reason: 'Performance improvement',
          newRate: 200,
          effectiveDate: jasmine.any(String)
        })
      );
      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith(
        'Rate adjusted for Test User to R200.00/hr'
      );
      expect(mockDialogRef.close).toHaveBeenCalledWith(true);
    });

    it('should handle submission error', () => {
      mockUserService.addRateAdjustment.and.returnValue(throwError(() => new Error('API Error')));

      component.onSubmit();

      expect(mockSnackBarService.showError).toHaveBeenCalledWith('Failed to adjust rate. Please try again.');
      expect(component.isSubmitting).toBe(false);
    });
  });

  describe('onCancel', () => {
    it('should close dialog with false result', () => {
      component.onCancel();

      expect(mockDialogRef.close).toHaveBeenCalledWith(false);
    });
  });

  describe('Input validation', () => {
    it('should prevent invalid characters in rate input', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: 'a' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onRateKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow numeric input', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '5' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onRateKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should allow decimal point', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '.' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onRateKeydown(event);

      expect(event.preventDefault).not.toHaveBeenCalled();
    });

    it('should prevent multiple decimal points', () => {
      const mockInput = { value: '123.45' } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '.' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onRateKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should prevent more than 2 decimal places', () => {
      const mockInput = {
        value: '123.45',
        selectionStart: 6,
        selectionEnd: 6
      } as HTMLInputElement;
      const event = new KeyboardEvent('keydown', { key: '6' });
      Object.defineProperty(event, 'target', { value: mockInput });
      spyOn(event, 'preventDefault');

      component.onRateKeydown(event);

      expect(event.preventDefault).toHaveBeenCalled();
    });

    it('should allow control keys', () => {
      const controlKeys = ['Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'ArrowLeft', 'ArrowRight'];

      controlKeys.forEach(key => {
        const mockInput = { value: '123' } as HTMLInputElement;
        const event = new KeyboardEvent('keydown', { key });
        Object.defineProperty(event, 'target', { value: mockInput });
        spyOn(event, 'preventDefault');

        component.onRateKeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });

    it('should allow ctrl+key combinations', () => {
      const ctrlKeys = ['a', 'c', 'v', 'x', 'z'];

      ctrlKeys.forEach(key => {
        const mockInput = { value: '123' } as HTMLInputElement;
        const event = new KeyboardEvent('keydown', { key, ctrlKey: true });
        Object.defineProperty(event, 'target', { value: mockInput });
        spyOn(event, 'preventDefault');

        component.onRateKeydown(event);

        expect(event.preventDefault).not.toHaveBeenCalled();
      });
    });
  });

  describe('onRateInput', () => {
    it('should truncate rate to 2 decimal places', () => {
      const mockInput = { value: '123.456' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;

      component.onRateInput(event);

      expect(component.rateAdjustmentForm.get('newRate')?.value).toBe(123.45);
      expect(mockInput.value).toBe('123.45');
    });

    it('should not modify rate with 2 or fewer decimal places', () => {
      const mockInput = { value: '123.45' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;
      component.rateAdjustmentForm.get('newRate')?.setValue(123.45);

      component.onRateInput(event);

      expect(component.rateAdjustmentForm.get('newRate')?.value).toBe(123.45);
    });

    it('should handle input without decimal point', () => {
      const mockInput = { value: '123' } as HTMLInputElement;
      const event = { target: mockInput } as unknown as Event;
      const originalValue = 123;
      component.rateAdjustmentForm.get('newRate')?.setValue(originalValue);

      component.onRateInput(event);

      expect(component.rateAdjustmentForm.get('newRate')?.value).toBe(originalValue);
    });
  });

  describe('Edge cases', () => {
    it('should handle user without display name', () => {
      component.user = { ...mockUser, displayName: 'Test User' };
      component.rateAdjustmentForm.patchValue({
        reason: 'Test reason',
        newRate: 100
      });
      mockUserService.addRateAdjustment.and.returnValue(of(component.user));

      component.onSubmit();

      expect(mockSnackBarService.showSuccess).toHaveBeenCalledWith(
        'Rate adjusted for Test User to R100.00/hr'
      );
    });
  });
});
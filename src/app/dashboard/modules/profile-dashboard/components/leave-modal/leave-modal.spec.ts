import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, FormGroup, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';

import { LeaveModal, dateRangeValidator } from './leave-modal';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { ILeave } from '../../../../../models/interfaces/ILeave.interface';
import { ELeave } from '../../../../../models/enums/ELeave.enum';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { Theme } from '../../../../../services/theme-service';

// --- MOCK DATA ---
// Fully typed mock user to satisfy the IUser interface
const mockUser: IUser = {
  _id: 'user123',
  googleId: 'google123',
  email: 'john@example.com',
  displayName: 'John Doe',
  firstLogin: false,
  createdAt: new Date(),
  roles: [],
  type: EUserType.Staff,
  permissions: [],
  pending: false,
  disabled: false,
  theme: 'light',
  leave: [
    {
      _id: 'leave1',
      reason: 'Vacation',
      startDate: new Date('2025-10-10'),
      endDate: new Date('2025-10-15'),
      approved: ELeave.Pending,
    },
  ],
};

describe('LeaveModal', () => {
  let component: LeaveModal;
  let fixture: ComponentFixture<LeaveModal>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<LeaveModal>>;

  beforeEach(async () => {
    userServiceSpy = jasmine.createSpyObj('UserService', ['getUser', 'requestLeave']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [LeaveModal, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockUser },
      ],
    }).compileComponents();

    // Default mocks
    // FIX: Mock the getUser() call that happens in ngOnInit to prevent test setup from failing.
    userServiceSpy.getUser.and.returnValue(of(mockUser));
    userServiceSpy.requestLeave.and.returnValue(of({} as any)); // Assuming a successful response

    fixture = TestBed.createComponent(LeaveModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should call getUser and set the display name on init', fakeAsync(() => {
      // ngOnInit is called during fixture.detectChanges() in the beforeEach block.
      // We just need to tick() to allow the observable to resolve.
      tick();
      expect(userServiceSpy.getUser).toHaveBeenCalled();
      expect(component.leaveForm.get('name')?.value).toBe(mockUser.displayName);
    }));
  });

  describe('Form Submission', () => {
    it('should not submit if the form is invalid', () => {
      // Form is invalid by default
      component.onSubmit();
      expect(userServiceSpy.requestLeave).not.toHaveBeenCalled();
    });

    it('should mark all fields as touched if form is invalid on submit', () => {
      const markAllAsTouchedSpy = spyOn(component.leaveForm, 'markAllAsTouched');
      component.onSubmit();
      expect(markAllAsTouchedSpy).toHaveBeenCalled();
    });

    it('should submit the form and close the dialog on success', fakeAsync(() => {
      // Set valid form values
      component.leaveForm.patchValue({
        reason: 'Holiday',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
      });

      component.onSubmit();
      tick();

      expect(userServiceSpy.requestLeave).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should handle error on submission and not close dialog', fakeAsync(() => {
      const consoleErrorSpy = spyOn(console, 'error');
      userServiceSpy.requestLeave.and.returnValue(throwError(() => new Error('API Error')));

      component.leaveForm.patchValue({
        reason: 'Holiday',
        startDate: new Date('2025-11-01'),
        endDate: new Date('2025-11-05'),
      });

      component.onSubmit();
      tick();

      expect(userServiceSpy.requestLeave).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
    }));
  });

  describe('dateRangeValidator', () => {
    const existingLeave: ILeave[] = [
      { _id: 'leave2', reason: 'Old trip', startDate: new Date('2025-05-10'), endDate: new Date('2025-05-15'), approved: ELeave.Approved }
    ];
    let form: FormGroup;

    beforeEach(() => {
      form = new FormGroup({
        startDate: new FormControl(null),
        endDate: new FormControl(null),
      }, { validators: dateRangeValidator(existingLeave) });
    });

    it('should return { invalidRange: true } if start date is after end date', () => {
      form.setValue({ startDate: new Date('2025-06-10'), endDate: new Date('2025-06-05') });
      expect(form.errors).toEqual({ invalidRange: true });
    });

    it('should return { overlapRange: true } if dates overlap with existing leave', () => {
      form.setValue({ startDate: new Date('2025-05-14'), endDate: new Date('2025-05-20') });
      expect(form.errors).toEqual({ overlapRange: true });
    });

    it('should return { overlapRange: true } if new leave fully contains existing leave', () => {
      form.setValue({ startDate: new Date('2025-05-01'), endDate: new Date('2025-05-20') });
      expect(form.errors).toEqual({ overlapRange: true });
    });

    it('should return null if dates are valid and do not overlap', () => {
      form.setValue({ startDate: new Date('2025-07-01'), endDate: new Date('2025-07-10') });
      expect(form.errors).toBeNull();
    });

    it('should return null if start or end date is missing', () => {
      form.setValue({ startDate: new Date('2025-07-01'), endDate: null });
      expect(form.errors).toBeNull();
    });
  });
});


import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { AddExtraWorkModal } from './add-extra-work-modal';
import { UserService } from '../../../../../services/user-service';
import { ExtraWorkService } from '../../../../../services/extra-work';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Theme } from '../../../../../services/theme-service';

describe('AddExtraWorkModal', () => {
  let component: AddExtraWorkModal;
  let fixture: ComponentFixture<AddExtraWorkModal>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockExtraWorkService: jasmine.SpyObj<ExtraWorkService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddExtraWorkModal>>;

  // ✅ FIX: Mock users now correctly implement the IUser interface
  const mockUsers: IUser[] = [
    { _id: '1', displayName: 'Student A', type: EUserType.Client, permissions: [], email: 'student@test.com', googleId: 'g1', firstLogin: false, createdAt: new Date(), roles: [], pending: false, disabled: false, theme: 'light' as Theme, leave: [], paymentType: 'Contract', monthlyMinimum: 0, rateAdjustments: [] },
    { _id: '2', displayName: 'Commissioner B', type: EUserType.Admin, permissions: [EPermission.EXTRA_WORK_APPROVE], email: 'commissioner@test.com', googleId: 'g2', firstLogin: false, createdAt: new Date(), roles: [], pending: false, disabled: false, theme: 'light' as Theme, leave: [], paymentType: 'Salaried', monthlyMinimum: 5000, rateAdjustments: [] },
    { _id: '3', displayName: 'User C', type: EUserType.Staff, permissions: [], email: 'user@test.com', googleId: 'g3', firstLogin: false, createdAt: new Date(), roles: [], pending: false, disabled: false, theme: 'light' as Theme, leave: [], paymentType: 'Contract', monthlyMinimum: 0, rateAdjustments: [] },
  ];

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['fetchAllUsers']);
    // This is how you properly mock a getter property
    Object.defineProperty(mockUserService, 'allUsers$', {
      value: of(mockUsers)
    });
    // ✅ FIX: Return an observable of an empty array to match the service's expected return type
    mockUserService.fetchAllUsers.and.returnValue(of([]));

    mockExtraWorkService = jasmine.createSpyObj('ExtraWorkService', ['createExtraWork']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddExtraWorkModal, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService },
        { provide: ExtraWorkService, useValue: mockExtraWorkService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddExtraWorkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create and fetch users on init', () => {
    expect(component).toBeTruthy();
    expect(mockUserService.fetchAllUsers).toHaveBeenCalled();
  });

  it('should filter students and commissioners correctly from the user list', (done) => {
    component.students$.subscribe(students => {
      expect(students.length).toBe(1);
      expect(students[0].displayName).toBe('Student A');
    });
    component.commissioners$.subscribe(commissioners => {
      expect(commissioners.length).toBe(1);
      expect(commissioners[0].displayName).toBe('Commissioner B');
      done(); // Call done to signal that the async test is complete
    });
  });

  it('should close the dialog when onCancel is called', () => {
    component.onCancel();
    expect(mockDialogRef.close).toHaveBeenCalled();
  });

  describe('onSave', () => {
    beforeEach(() => {
      // Set form values to be valid
      component.addWorkForm.setValue({
        studentId: '1',
        commissionerId: '2',
        workType: 'Marking',
        details: 'Some details about the work.',
        remuneration: 150
      });
    });

    it('should not save if the form is invalid', () => {
      component.addWorkForm.get('studentId')?.setValue(''); // Make form invalid
      component.onSave();
      expect(mockExtraWorkService.createExtraWork).not.toHaveBeenCalled();
    });

    it('should call createExtraWork and close the dialog with the new item on success', fakeAsync(() => {
      const newWorkItem = { ...component.addWorkForm.value, _id: 'newId' };
      mockExtraWorkService.createExtraWork.and.returnValue(of(newWorkItem));

      component.onSave();
      expect(component.isSaving).toBeTrue();
      tick(); // Simulate the passage of time for the async operation

      expect(mockExtraWorkService.createExtraWork).toHaveBeenCalledWith(component.addWorkForm.value);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Extra work entry created successfully!');
      expect(mockDialogRef.close).toHaveBeenCalledWith(newWorkItem);
    }));

    it('should show an error message and reset isSaving on API error', fakeAsync(() => {
      const errorResponse = { error: { message: 'Creation failed' } };
      mockExtraWorkService.createExtraWork.and.returnValue(throwError(() => errorResponse));

      component.onSave();
      tick();

      expect(component.isSaving).toBeFalse();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Creation failed');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    }));

    it('should use a default error message if the API error has no message property', fakeAsync(() => {
        mockExtraWorkService.createExtraWork.and.returnValue(throwError(() => ({})));
        component.onSave();
        tick();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to create entry.');
    }));
  });

  it('should validate form controls correctly', () => {
    const controls = component.addWorkForm.controls;

    // Test required validators
    expect(controls['studentId'].valid).toBeFalse();
    controls['studentId'].setValue('1');
    expect(controls['studentId'].valid).toBeTrue();

    // Test maxLength validator
    controls['details'].setValue('a'.repeat(281));
    expect(controls['details'].hasError('maxlength')).toBeTrue();

    // Test min/max validators for remuneration
    controls['remuneration'].setValue(-10);
    expect(controls['remuneration'].hasError('min')).toBeTrue();
    controls['remuneration'].setValue(5001);
    expect(controls['remuneration'].hasError('max')).toBeTrue();
  });
});
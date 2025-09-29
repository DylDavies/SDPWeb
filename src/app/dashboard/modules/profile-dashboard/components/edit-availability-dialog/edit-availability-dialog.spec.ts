import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { EditAvailabilityDialog } from './edit-availability-dialog';
import { SnackBarService } from '../../../../../services/snackbar-service';

describe('EditAvailabilityDialog', () => {
  let component: EditAvailabilityDialog;
  let fixture: ComponentFixture<EditAvailabilityDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditAvailabilityDialog>>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  // Function to setup TestBed for different data scenarios
  const setupTestBed = async (data: { availability: number }) => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showInfo']);

    await TestBed.configureTestingModule({
      imports: [
        EditAvailabilityDialog,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditAvailabilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Component Initialization', () => {
    beforeEach(async () => {
      await setupTestBed({ availability: 25 });
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize the form with the availability value from MAT_DIALOG_DATA', () => {
      expect(component.form.get('availability')?.value).toBe(25);
    });
  });

  describe('Form Validation', () => {
    beforeEach(async () => {
      await setupTestBed({ availability: 10 });
    });

    it('should be valid with a number between 0 and 56', () => {
      component.form.get('availability')?.setValue(40);
      expect(component.form.valid).toBeTrue();
    });

    it('should be invalid if availability is not provided', () => {
      component.form.get('availability')?.setValue(null);
      expect(component.form.invalid).toBeTrue();
      expect(component.form.get('availability')?.hasError('required')).toBeTrue();
    });

    it('should be invalid if availability is negative', () => {
      component.form.get('availability')?.setValue(-5);
      expect(component.form.invalid).toBeTrue();
      expect(component.form.get('availability')?.hasError('min')).toBeTrue();
    });

    it('should be invalid if availability is greater than 56', () => {
      component.form.get('availability')?.setValue(57);
      expect(component.form.invalid).toBeTrue();
      expect(component.form.get('availability')?.hasError('max')).toBeTrue();
    });
  });

  describe('User Actions', () => {
    beforeEach(async () => {
      await setupTestBed({ availability: 15 });
    });

    it('should close the dialog without a value when onCancel is called', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should not save or close the dialog if the form is invalid', () => {
      component.form.get('availability')?.setValue(-10); // Invalid value
      component.onSave();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should save and close the dialog with the new value when form is valid', () => {
      component.form.get('availability')?.setValue(30);
      component.onSave();
      expect(mockDialogRef.close).toHaveBeenCalledWith(30);
    });

    it('should show an error and not close if availability exceeds 168', () => {
      // Set a value that is valid for the form control but invalid for the custom logic
      component.form.get('availability')?.setValidators(null); // Temporarily remove validators for this test
      component.form.get('availability')?.updateValueAndValidity();
      component.form.get('availability')?.setValue(200);

      component.onSave();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('There are only 168 hours in a week.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should show the "dumbass" error on a 1 in 10000 chance when availability > 168', () => {
        // Spy on Math.random and make it return a value that triggers the condition
        spyOn(Math, 'random').and.returnValue(0.00001); // This will result in Math.floor(0.00001 * 10000) + 1 = 1

        component.form.get('availability')?.setValidators(null);
        component.form.get('availability')?.updateValueAndValidity();
        component.form.get('availability')?.setValue(200);
  
        component.onSave();
  
        expect(mockSnackbarService.showError).toHaveBeenCalledWith("Are you a fucking dumbass???? There are only 168 hours in a week.");
        expect(mockDialogRef.close).not.toHaveBeenCalled();
      });
  });
});

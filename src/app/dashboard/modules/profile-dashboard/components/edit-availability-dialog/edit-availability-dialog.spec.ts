import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { EditAvailabilityDialog } from './edit-availability-dialog';
import { SnackBarService } from '../../../../../services/snackbar-service';

describe('EditAvailabilityDialog', () => {
  let component: EditAvailabilityDialog;
  let fixture: ComponentFixture<EditAvailabilityDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditAvailabilityDialog>>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError']);

    await TestBed.configureTestingModule({
      imports: [
        EditAvailabilityDialog,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: { availability: 20 } },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAvailabilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize the form with the availability from MAT_DIALOG_DATA', () => {
    expect(component.form.get('availability')?.value).toBe(20);
  });

  it('should make the form invalid if availability is not provided', () => {
    component.form.get('availability')?.setValue(null);
    expect(component.form.invalid).toBeTrue();
  });

  it('should make the form invalid if availability is less than 0', () => {
    component.form.get('availability')?.setValue(-5);
    expect(component.form.invalid).toBeTrue();
    expect(component.form.get('availability')?.hasError('min')).toBeTrue();
  });

  it('should make the form invalid if availability is greater than 56', () => {
    component.form.get('availability')?.setValue(57);
    expect(component.form.invalid).toBeTrue();
    expect(component.form.get('availability')?.hasError('max')).toBeTrue();
  });

  it('should be valid for availability between 0 and 56', () => {
    component.form.get('availability')?.setValue(40);
    expect(component.form.valid).toBeTrue();
  });

  describe('onSave', () => {
    it('should not close the dialog if the form is invalid', () => {
      component.form.get('availability')?.setValue(-10); // Invalid value
      component.onSave();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close the dialog with the form value if the form is valid', () => {
      component.form.get('availability')?.setValue(35);
      component.onSave();
      expect(mockDialogRef.close).toHaveBeenCalledWith(35);
    });

    it('should show an error and not close if availability exceeds 168', () => {
      component.form.get('availability')?.clearValidators();
      component.form.get('availability')?.setValidators([Validators.required, Validators.min(0)]);
      component.form.get('availability')?.updateValueAndValidity();

      component.form.get('availability')?.setValue(200);
      component.onSave();
      
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('There are only 168 hours in a week.');
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });
  });

  describe('onCancel', () => {
    it('should close the dialog without sending data', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalled();
      expect(mockDialogRef.close).toHaveBeenCalledWith(); // Called with no arguments
    });
  });
});
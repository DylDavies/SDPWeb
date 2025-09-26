import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError } from 'rxjs';
import { CreateEditBadgeDialogComponent, futureDateValidator } from './create-edit-badge-dialog';
import { BadgeService } from '../../../../../services/badge-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';

let badgeServiceSpy: jasmine.SpyObj<BadgeService>;
let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateEditBadgeDialogComponent>>;

const mockBadgeData: IBadge = {
  _id: 'badge123',
  name: 'Existing Badge',
  TLA: 'EXB',
  summary: 'An existing summary',
  description: 'An existing description',
  image: 'star',
  permanent: false,
  expirationDate: new Date('2099-12-31'),
  bonus: 50
};

describe('CreateEditBadgeDialogComponent', () => {
  let component: CreateEditBadgeDialogComponent;
  let fixture: ComponentFixture<CreateEditBadgeDialogComponent>;

  const configureTestingModule = async (data: any) => {
    badgeServiceSpy = jasmine.createSpyObj('BadgeService', ['addOrUpdateBadge']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CreateEditBadgeDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: BadgeService, useValue: badgeServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEditBadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('in Create Mode', () => {
    beforeEach(async () => {
      await configureTestingModule({});
    });

    it('should initialize the form for creating a new badge', () => {
      expect(component.isEditMode).toBeFalse();
      expect(component.badgeForm).toBeDefined();
      expect(component.badgeForm.get('name')?.value).toBe('');
      expect(component.badgeForm.contains('requirements')).toBeTrue();
    });

    it('should call addOrUpdateBadge on save and close the dialog on success', fakeAsync(() => {
      badgeServiceSpy.addOrUpdateBadge.and.returnValue(of({} as IBadge));
      component.badgeForm.setValue({
        name: 'New Badge', TLA: 'NEW', summary: 'S', description: 'D', image: 'star',
        permanent: true, expirationDate: null, bonus: 10, requirements: 'Do the thing'
      });

      component.onSave();
      tick();

      expect(badgeServiceSpy.addOrUpdateBadge).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Badge created successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));
  });

  describe('in Edit Mode', () => {
    beforeEach(async () => {
      await configureTestingModule({ badge: mockBadgeData });
    });

    it('should initialize and patch the form with existing badge data', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.badgeForm.get('name')?.value).toBe(mockBadgeData.name);
      expect(component.badgeForm.get('TLA')?.value).toBe(mockBadgeData.TLA);
      expect(component.badgeForm.contains('requirements')).toBeFalse();
    });

    it('should call addOrUpdateBadge with an _id on save', fakeAsync(() => {
      badgeServiceSpy.addOrUpdateBadge.and.returnValue(of({} as IBadge));
      component.badgeForm.get('name')?.setValue('Updated Name');

      component.onSave();
      tick();

      const expectedPayload = { ...component.badgeForm.value, _id: mockBadgeData._id };
      expect(badgeServiceSpy.addOrUpdateBadge).toHaveBeenCalledWith(expectedPayload);
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Badge updated successfully.');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));
  });

  describe('Form Logic and Validation', () => {
    beforeEach(async () => {
      await configureTestingModule({});
    });

    it('should not save if the form is invalid', () => {
      component.onSave(); // Form is invalid by default
      expect(badgeServiceSpy.addOrUpdateBadge).not.toHaveBeenCalled();
    });

    it('should select an icon and update the form value', () => {
        component.selectIcon('new_icon');
        expect(component.badgeForm.get('image')?.value).toBe('new_icon');
    });

    it('should make expirationDate required when permanent is false', () => {
      const expirationDateControl = component.badgeForm.get('expirationDate');
      component.badgeForm.get('permanent')?.setValue(false);
      expect(expirationDateControl?.hasValidator(Validators.required)).toBeTrue();
    });

    it('should make expirationDate optional when permanent is true', () => {
      const expirationDateControl = component.badgeForm.get('expirationDate');
      component.badgeForm.get('permanent')?.setValue(false); // Start as non-permanent
      component.badgeForm.get('permanent')?.setValue(true); // Toggle to permanent
      expect(expirationDateControl?.hasValidator(Validators.required)).toBeFalse();
      expect(expirationDateControl?.value).toBeNull();
    });

    it('should fail futureDateValidator for a past date', () => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 1);
        const control = component.badgeForm.get('expirationDate');
        control?.setValue(pastDate);
        expect(control?.hasError('pastDate')).toBeTrue();
    });

    it('should pass futureDateValidator for a future date', () => {
        const futureDate = new Date();
        futureDate.setDate(futureDate.getDate() + 1);
        const control = component.badgeForm.get('expirationDate');
        control?.setValue(futureDate);
        expect(control?.hasError('pastDate')).toBeFalse();
    });
  });
});
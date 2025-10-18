import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { EditAddressDialog } from './edit-address-dialog';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IAddress } from '../../../../../models/interfaces/IAddress.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';

describe('EditAddressDialog', () => {
  let component: EditAddressDialog;
  let fixture: ComponentFixture<EditAddressDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditAddressDialog>>;
  let userService: jasmine.SpyObj<UserService>;
  let snackbarService: jasmine.SpyObj<SnackBarService>;

  const mockAddress: IAddress = {
    streetAddress: '123 Main St',
    city: 'Test City',
    state: 'Test State',
    postalCode: '12345',
    country: 'Test Country'
  };

  const mockUser: Partial<IUser> = {
    _id: 'user1',
    displayName: 'Test User',
    address: mockAddress
  };

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    const userServiceSpy = jasmine.createSpyObj('UserService', ['updateProfile']);
    const snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [EditAddressDialog, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockUser },
        { provide: UserService, useValue: userServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy }
      ]
    })
    .compileComponents();

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditAddressDialog>>;
    userService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    snackbarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    fixture = TestBed.createComponent(EditAddressDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSave', () => {
    it('should not proceed if already saving', () => {
      component.isSaving = true;
      component.onSave();

      expect(userService.updateProfile).not.toHaveBeenCalled();
    });

    it('should update profile successfully and close dialog', () => {
      const updatedUser = { ...mockUser, address: mockAddress } as IUser;
      userService.updateProfile.and.returnValue(of(updatedUser));
      component.selectedAddress = mockAddress;

      component.onSave();

      expect(component.isSaving).toBe(true);
      expect(userService.updateProfile).toHaveBeenCalledWith({ address: mockAddress });
      expect(snackbarService.showSuccess).toHaveBeenCalledWith('Address updated successfully!');
      expect(dialogRef.close).toHaveBeenCalledWith(updatedUser);
    });

    it('should handle update error and reset saving state', () => {
      const error = new Error('Update failed');
      userService.updateProfile.and.returnValue(throwError(() => error));
      const consoleErrorSpy = spyOn(console, 'error');
      component.selectedAddress = mockAddress;

      component.onSave();

      expect(userService.updateProfile).toHaveBeenCalled();
      expect(snackbarService.showError).toHaveBeenCalledWith('Failed to update address.');
      expect(consoleErrorSpy).toHaveBeenCalledWith(error);
      expect(component.isSaving).toBe(false);
    });
  });

  describe('clearAddress', () => {
    it('should clear address and reset selectedAddress', () => {
      component.addressComponent = jasmine.createSpyObj('AddressAutocompleteComponent', ['clearAddress']);
      component.selectedAddress = mockAddress;

      component.clearAddress();

      expect(component.addressComponent.clearAddress).toHaveBeenCalled();
      expect(component.selectedAddress).toBeUndefined();
    });
  });

  describe('onAddressSelected', () => {
    it('should update selectedAddress', () => {
      component.onAddressSelected(mockAddress);
      expect(component.selectedAddress).toEqual(mockAddress);
    });
  });

  describe('onCancel', () => {
    it('should close dialog without data', () => {
      component.onCancel();
      expect(dialogRef.close).toHaveBeenCalled();
    });
  });
});

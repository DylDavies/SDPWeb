import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { UserService } from '../../../services/user-service';
import { NotificationService } from '../../../services/notification-service';
import { EditProfileComponent } from './edit-profile-component';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { By } from '@angular/platform-browser';

// Create a mock user to pass as dialog data
const mockUserData: IUser = {
  _id: 'user-123',
  email: 'test@example.com',
  displayName: 'Old Name',
  type: EUserType.Staff,
  picture: '',
  createdAt: new Date(),
  firstLogin: false,
  googleId: '',
  roles: [],
  permissions: [],
  pending: false,
  disabled: false,
  leave: [],
};

// Create spies for the service dependencies
const userServiceSpy = jasmine.createSpyObj('UserService', ['updateProfile']);
const notificationServiceSpy = jasmine.createSpyObj('NotificationService', ['showSuccess', 'showError']);
const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

describe('EditProfileComponent', () => {
  let component: EditProfileComponent;
  let fixture: ComponentFixture<EditProfileComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditProfileComponent,
        NoopAnimationsModule // Disables animations for tests
      ],
      providers: [
        // Provide mock implementations for all dependencies
        { provide: UserService, useValue: userServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        // THIS IS THE FIX: Provide a mock value for MAT_DIALOG_DATA
        { provide: MAT_DIALOG_DATA, useValue: mockUserData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Reset spies before each test
    userServiceSpy.updateProfile.calls.reset();
    notificationServiceSpy.showSuccess.calls.reset();
    notificationServiceSpy.showError.calls.reset();
    dialogRefSpy.close.calls.reset();
  });

  it('should create and pre-fill the form with initial data', () => {
    expect(component).toBeTruthy();
    expect(component.editForm.value.displayName).toBe('Old Name');
  });

  it('should disable the save button when the form is invalid', () => {
    component.editForm.controls['displayName'].setValue('');
    fixture.detectChanges();

    const saveButton = fixture.debugElement.query(By.css('button[color="primary"]')).nativeElement;
    expect(saveButton.disabled).toBeTrue();
  });

  it('should call userService.updateProfile and close the dialog on save', () => {
    // Arrange
    const newName = 'New Name';
    const updatedUserResponse: IUser = { ...mockUserData, displayName: newName };
    userServiceSpy.updateProfile.and.returnValue(of(updatedUserResponse));
    component.editForm.controls['displayName'].setValue(newName);

    // Act
    component.onSave();

    // Assert
    expect(component.isSaving).toBeTrue();
    expect(userServiceSpy.updateProfile).toHaveBeenCalledOnceWith({ displayName: newName });
    
    // Check that the success notification was shown and the dialog was closed with the new user data
    expect(notificationServiceSpy.showSuccess).toHaveBeenCalledWith('Profile updated successfully!');
    expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(updatedUserResponse);
  });

  it('should show an error notification if the update fails', () => {
    // Arrange
    const errorResponse = { message: 'Update failed' };
    userServiceSpy.updateProfile.and.returnValue(throwError(() => errorResponse));
    component.editForm.controls['displayName'].setValue('A valid name');

    // Act
    component.onSave();

    // Assert
    expect(component.isSaving).toBeFalse(); // Should be reset on error
    expect(notificationServiceSpy.showError).toHaveBeenCalledWith('Failed to update profile.');
    expect(dialogRefSpy.close).not.toHaveBeenCalled(); // Dialog should not close on error
  });
});
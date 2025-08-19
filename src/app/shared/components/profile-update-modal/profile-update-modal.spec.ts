import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { ProfileUpdateModal } from './profile-update-modal';
import { IUser } from '../../../models/interfaces/IUser.interface';

// Mock for UserService
const userServiceSpy = jasmine.createSpyObj('UserService', ['updateProfile']);

// Mock for MatDialogRef
const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

// Mock for AuthService
const authServiceSpy = jasmine.createSpyObj('AuthService', ['saveToken']);

describe('ProfileUpdateModalComponent', () => {
  let component: ProfileUpdateModal;
  let fixture: ComponentFixture<ProfileUpdateModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        ProfileUpdateModal,
        NoopAnimationsModule // Use NoopAnimationsModule to disable animations in tests
      ],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileUpdateModal);
    component = fixture.componentInstance;
    fixture.detectChanges();

    // Reset spies before each test
    userServiceSpy.updateProfile.calls.reset();
    dialogRefSpy.close.calls.reset();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should have an invalid form when display name is empty', () => {
    expect(component.profileForm.valid).toBeFalse();
  });

  it('should have a valid form when display name is filled', () => {
    component.profileForm.controls['displayName'].setValue('Test User');
    expect(component.profileForm.valid).toBeTrue();
  });

  it('should not call the user service if the form is invalid on submit', () => {
    component.onSubmit();
    expect(userServiceSpy.updateProfile).not.toHaveBeenCalled();
  });

  it('should call the user service and close the dialog with the updated user on successful submit', () => {
    // Arrange
    const newName = 'New Display Name';
    const updatedUser: Partial<IUser> = { displayName: newName };
    userServiceSpy.updateProfile.and.returnValue(of({ ...updatedUser, firstLogin: false }));

    component.profileForm.controls['displayName'].setValue(newName);
    fixture.detectChanges();

    // Act
    component.onSubmit();

    // Assert
    expect(component.isSaving).toBeTrue();
    expect(userServiceSpy.updateProfile).toHaveBeenCalledOnceWith({ displayName: newName });

    // Simulate the observable returning
    fixture.detectChanges();

    // The dialog should close with the user object (and firstLogin set to false)
    const expectedUserCloseValue = { displayName: newName, firstLogin: false };
    expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(jasmine.objectContaining(expectedUserCloseValue));
  });
});
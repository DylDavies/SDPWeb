import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { profileCompletionGuard } from './profile-completion-guard';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { ProfileUpdateModal } from '../shared/components/profile-update-modal/profile-update-modal';

// --- Mock Data ---
const firstLoginUser: IUser = {
  _id: '1', displayName: 'New User', email: 'new@test.com',
  firstLogin: true,
  pending: false, disabled: false, type: EUserType.Staff, roles: [], permissions: [],
  picture: '', createdAt: new Date(), googleId: '', theme: 'system', leave: [],
  paymentType: 'Contract' as const,
  monthlyMinimum: 0,
  rateAdjustments: []
};

const existingUser: IUser = { ...firstLoginUser, firstLogin: false };
const updatedUser: IUser = { ...firstLoginUser, displayName: 'Updated Name', firstLogin: false };

// --- Mock Services ---
const mockAuthService = {
  verifyCurrentUser: () => of<IUser | null>(null),
  updateCurrentUserState: (user: IUser) => {}
};

// We need a mock for the MatDialogRef that the dialog.open() method returns
const mockDialogRef = {
  afterClosed: () => of(null as IUser | null) // Default to closing with no data (e.g., user cancels)
};

// FIX: Update the mock 'open' method to accept arguments, even if it doesn't use them.
const mockDialog = {
  open: (component: any, config?: any) => mockDialogRef
};

describe('profileCompletionGuard', () => {
  // Helper function to execute the guard within an injection context
  const executeGuard = (): Observable<boolean> => {
    const route: any = {}; // Mock ActivatedRouteSnapshot
    const state: any = {}; // Mock RouterStateSnapshot
    return TestBed.runInInjectionContext(() => profileCompletionGuard(route, state)) as Observable<boolean>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog }
      ]
    });
  });

  it('should allow activation and do nothing if no user is logged in', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(null));
    spyOn(mockDialog, 'open');
    let result = false;

    executeGuard().subscribe(res => result = res);
    tick();

    expect(result).toBe(true);
    expect(mockDialog.open).not.toHaveBeenCalled();
  }));

  it('should allow activation and do nothing if the user does not have firstLogin flag', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(existingUser));
    spyOn(mockDialog, 'open');
    let result = false;

    executeGuard().subscribe(res => result = res);
    tick();

    expect(result).toBe(true);
    expect(mockDialog.open).not.toHaveBeenCalled();
  }));

  it('should open the profile update modal if the user has the firstLogin flag', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(firstLoginUser));
    spyOn(mockDialog, 'open').and.returnValue(mockDialogRef);

    executeGuard().subscribe();
    tick();

    expect(mockDialog.open).toHaveBeenCalledOnceWith(ProfileUpdateModal, jasmine.any(Object));
  }));

  it('should update the auth state if the modal is closed with an updated user', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(firstLoginUser));
    spyOn(mockDialogRef, 'afterClosed').and.returnValue(of(updatedUser));
    spyOn(mockDialog, 'open').and.returnValue(mockDialogRef);
    spyOn(mockAuthService, 'updateCurrentUserState');
    let result = false;

    executeGuard().subscribe(res => result = res);
    tick();

    expect(mockAuthService.updateCurrentUserState).toHaveBeenCalledOnceWith(updatedUser);
    expect(result).toBe(true);
  }));

  it('should NOT update the auth state if the modal is closed without data', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(firstLoginUser));
    spyOn(mockDialogRef, 'afterClosed').and.returnValue(of(null)); // Simulate user cancelling
    spyOn(mockDialog, 'open').and.returnValue(mockDialogRef);
    spyOn(mockAuthService, 'updateCurrentUserState');
    let result = false;

    executeGuard().subscribe(res => result = res);
    tick();

    expect(mockAuthService.updateCurrentUserState).not.toHaveBeenCalled();
    expect(result).toBe(true);
  }));
});

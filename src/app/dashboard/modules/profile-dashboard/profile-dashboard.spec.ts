import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { BehaviorSubject, of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { Profile } from './profile-dashboard';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EditProfileComponent } from '../../../shared/components/edit-profile-component/edit-profile-component';
import { EditAvailabilityDialog } from './components/edit-availability-dialog/edit-availability-dialog';
import { LeaveModal } from './components/leave-modal/leave-modal';

// --- MOCK DATA ---
const mockCurrentUser: IUser = { _id: 'currentUser123', displayName: 'Current User' } as IUser;
const mockOtherUser: IUser = { _id: 'otherUser456', displayName: 'Other User' } as IUser;

describe('ProfileDashboardComponent', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;
  let mockAuthService: {
    currentUser$: BehaviorSubject<IUser | null>;
    updateCurrentUserState: jasmine.Spy;
    hasPermission: jasmine.Spy;
  };
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockActivatedRoute: any;

  const setupComponent = (routeId: string | null) => {
    mockAuthService = {
      currentUser$: new BehaviorSubject<IUser | null>(mockCurrentUser),
      updateCurrentUserState: jasmine.createSpy('updateCurrentUserState'),
      hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true),
    };
    mockUserService = jasmine.createSpyObj('UserService', ['getUserById', 'updateUserAvailability', 'fetchAllUsers', 'getTutorStats']);
    mockUserService.getTutorStats.and.returnValue(of({
      kpis: {
        totalHoursTaught: 0,
        netPay: 0,
        averageRating: 0,
        missionsCompleted: 0
      },
      charts: {
        hoursPerSubject: [],
        monthlyEarnings: []
      },
      recentActivity: [],
      leaveDaysTaken: 0
    }));
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (key: string) => key === 'id' ? routeId : null,
        },
      },
    };

    TestBed.configureTestingModule({
      imports: [
        Profile,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: ActivatedRoute, useValue: mockActivatedRoute },
      ],
    })
    .overrideComponent(Profile, {
      set: {
        providers: [
          { provide: MatDialog, useValue: mockDialog }
        ]
      }
    })
    .compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  };

  it('should create', () => {
    setupComponent(null);
    expect(component).toBeTruthy();
  });

  describe('User Loading Logic', () => {
    it('should load the current user when no ID is in the route', () => {
      setupComponent(null);
      mockUserService.getUserById.withArgs(mockCurrentUser._id).and.returnValue(of(mockCurrentUser));
      
      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.user).toEqual(mockCurrentUser);
      expect(component.isOwnProfile).toBeTrue();
    });

    it('should load another user when an ID is present in the route', () => {
      setupComponent(mockOtherUser._id);
      mockUserService.getUserById.withArgs(mockOtherUser._id).and.returnValue(of(mockOtherUser));

      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.user).toEqual(mockOtherUser);
      expect(component.isOwnProfile).toBeFalse();
    });

    it('should set userNotFound to true if the service returns null', () => {
      setupComponent('nonexistentUser');
      mockUserService.getUserById.withArgs('nonexistentUser').and.returnValue(of(null as any));

      fixture.detectChanges();

      expect(component.isLoading).toBeFalse();
      expect(component.userNotFound).toBeTrue();
      expect(component.user).toBeNull();
    });
  });

  describe('Dialog Interactions', () => {
    beforeEach(() => {
      setupComponent(mockCurrentUser._id);
      mockUserService.getUserById.and.returnValue(of(mockCurrentUser));
      fixture.detectChanges();
    });

    it('should open the LeaveModal', () => {
      const mockDialogRef = {
        afterClosed: () => of(null)
      } as MatDialogRef<any>;
      
      mockDialog.open.and.returnValue(mockDialogRef);
      
      component.openLeaveModal();
      
      expect(mockDialog.open).toHaveBeenCalledWith(LeaveModal, jasmine.objectContaining({
        width: jasmine.any(String),
        data: mockCurrentUser
      }));
    });

    it('should open EditProfileComponent and handle the result', () => {
      const updatedUser = { ...mockCurrentUser, displayName: 'Updated Name' };
      
      const mockDialogRef = {
        afterClosed: () => of(updatedUser)
      } as MatDialogRef<any>;
      
      mockDialog.open.and.returnValue(mockDialogRef);
      mockUserService.fetchAllUsers.and.returnValue(of([]));

      component.editProfile();

      expect(mockDialog.open).toHaveBeenCalledWith(EditProfileComponent, jasmine.objectContaining({
        width: jasmine.any(String),
        data: mockCurrentUser
      }));
      expect(mockAuthService.updateCurrentUserState).toHaveBeenCalledWith(updatedUser);
      expect(mockUserService.fetchAllUsers).toHaveBeenCalled();
    });

    it('should open EditAvailabilityDialog and handle success', () => {
      const updatedUser = { ...mockCurrentUser, availability: 40 };
      
      const mockDialogRef = {
        afterClosed: () => of(40)
      } as MatDialogRef<any>;
      
      mockDialog.open.and.returnValue(mockDialogRef);
      mockUserService.updateUserAvailability.and.returnValue(of(updatedUser));
      
      component.openEditAvailabilityDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(EditAvailabilityDialog, jasmine.objectContaining({
        width: jasmine.any(String),
        data: { availability: 0 }
      }));
      expect(mockUserService.updateUserAvailability).toHaveBeenCalledWith(mockCurrentUser._id, 40);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Availability updated successfully!');
      expect(component.user).toEqual(updatedUser);
    });

    it('should not open EditAvailabilityDialog if user is null', () => {
      component.user = null;
      component.openEditAvailabilityDialog();
      expect(mockDialog.open).not.toHaveBeenCalled();
    });

    it('should handle EditAvailabilityDialog cancellation', () => {
      const mockDialogRef = {
        afterClosed: () => of(null)
      } as MatDialogRef<any>;
      
      mockDialog.open.and.returnValue(mockDialogRef);
      
      component.openEditAvailabilityDialog();

      expect(mockUserService.updateUserAvailability).not.toHaveBeenCalled();
    });

    it('should handle error when updating availability', () => {
      const mockDialogRef = {
        afterClosed: () => of(40)
      } as MatDialogRef<any>;
      
      mockDialog.open.and.returnValue(mockDialogRef);
      mockUserService.updateUserAvailability.and.returnValue(throwError(() => new Error('Update failed')));
      
      component.openEditAvailabilityDialog();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to update availability.');
    });
  });
});
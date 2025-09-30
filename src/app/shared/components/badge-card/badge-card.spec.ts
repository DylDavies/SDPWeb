import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeCardComponent } from './badge-card';
import { AuthService } from '../../../services/auth-service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user-service';
import { BadgeService } from '../../../services/badge-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { of, throwError } from 'rxjs';
import { IUser, IUserBadge } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { Theme } from '../../../services/theme-service';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

describe('BadgeCardComponent', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockUser: IUser;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasPermission']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockUserService = jasmine.createSpyObj('UserService', ['removeBadgeFromUser']);
    mockBadgeService = jasmine.createSpyObj('BadgeService', ['deleteBadge']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    mockUser = {
      _id: 'user1',
      googleId: 'google123',
      email: 'john.doe@example.com',
      displayName: 'John Doe',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      type: EUserType.Staff,
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as Theme,
      leave: [],
      proficiencies: [],
      badges: [],
      paymentType: 'Contract',
      monthlyMinimum: 500,
      rateAdjustments: []
    };

    await TestBed.configureTestingModule({
      imports: [BadgeCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserService, useValue: mockUserService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: SnackBarService, useValue: mockSnackbarService },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeCardComponent);
    component = fixture.componentInstance;
    component.badge = { _id: '1', name: 'Test Badge', TLA: 'TBG', image: 'star', summary: 'A test badge.', description: 'Detailed description.', permanent: true, bonus: 100 };
    component.userBadge = {
        badge: component.badge,
        dateAdded: new Date().toISOString(),
    };
    component.userId = 'user1';

    // Provide a default return value for hasPermission to prevent unexpected errors
    mockAuthService.hasPermission.and.returnValue(false);
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and Permission Handling', () => {
    it('should set all permissions to true if auth service returns true for all', () => {
        mockAuthService.hasPermission.and.returnValue(true);
        component.ngOnInit();
        expect(component.canCreateOrEditBadges).toBeTrue();
        expect(component.canManageUserBadges).toBeTrue();
        expect(component.canViewRequirements).toBeTrue();
        expect(component.canManageRequirements).toBeTrue();
    });

    it('should set specific permissions correctly based on auth service', () => {
        mockAuthService.hasPermission.and.callFake((permission: EPermission) => {
            return permission === EPermission.BADGES_CREATE || permission === EPermission.BADGES_MANAGE_REQUIREMENTS;
        });
        component.ngOnInit();
        expect(component.canCreateOrEditBadges).toBeTrue();
        expect(component.canManageUserBadges).toBeFalse();
        expect(component.canViewRequirements).toBeFalse();
        expect(component.canManageRequirements).toBeTrue();
    });
  });

  describe('UI Rendering based on context', () => {
    it('should show admin actions for admin context if user has permissions', () => {
        mockAuthService.hasPermission.withArgs(EPermission.BADGES_CREATE).and.returnValue(true);
        component.context = 'admin';
        fixture.detectChanges(); // This will trigger ngOnInit
        const adminActions = fixture.nativeElement.querySelector('.admin-actions');
        expect(adminActions).toBeTruthy();
    });

    it('should show profile actions for profile context if user has permissions', () => {
        mockAuthService.hasPermission.withArgs(EPermission.BADGES_MANAGE).and.returnValue(true);
        component.context = 'profile';
        fixture.detectChanges();
        const profileActions = fixture.nativeElement.querySelector('.profile-actions');
        expect(profileActions).toBeTruthy();
    });

    it('should show library actions for library context if user has permissions', () => {
        mockAuthService.hasPermission.withArgs(EPermission.BADGES_VIEW_REQUIREMENTS).and.returnValue(true);
        component.context = 'library';
        fixture.detectChanges();
        const libraryActions = fixture.nativeElement.querySelector('.library-actions');
        expect(libraryActions).toBeTruthy();
    });
  });

  describe('Dialog Interactions', () => {
    it('should open the requirements dialog as editable for admin with correct permissions', () => {
        component.context = 'admin';
        component.canManageRequirements = true; // Set property directly for this test
        component.openRequirementsDialog();
        expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
            data: { badge: component.badge, isEditable: true }
        }));
    });

    it('should open the requirements dialog as non-editable if not admin or lacking permissions', () => {
        component.context = 'library';
        component.canManageRequirements = false;
        component.openRequirementsDialog();
        expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), jasmine.objectContaining({
            data: { badge: component.badge, isEditable: false }
        }));
    });

    it('should not emit badgeUpdated if edit dialog is closed without a result', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(null) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        spyOn(component.badgeUpdated, 'emit');
        component.editBadge();
        tick();
        expect(component.badgeUpdated.emit).not.toHaveBeenCalled();
    }));
  });

  describe('deleteBadge', () => {
    it('should delete the badge and emit update after confirmation', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        mockBadgeService.deleteBadge.and.returnValue(of(undefined));
        spyOn(component.badgeUpdated, 'emit');

        component.deleteBadge();
        tick();
        
        expect(mockBadgeService.deleteBadge).toHaveBeenCalledWith(component.badge._id);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge deleted successfully.');
        expect(component.badgeUpdated.emit).toHaveBeenCalled();
    }));

    it('should show error with specific message if deletion fails', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        mockBadgeService.deleteBadge.and.returnValue(throwError({ error: { message: 'Custom API error' } }));
        
        component.deleteBadge();
        tick();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom API error');
    }));

    it('should show generic error if deletion fails without a message', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        mockBadgeService.deleteBadge.and.returnValue(throwError({}));

        component.deleteBadge();
        tick();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to delete badge.');
    }));
  });

  describe('removeBadgeFromUser', () => {
    it('should call user service to remove badge and show success message', () => {
        mockUserService.removeBadgeFromUser.and.returnValue(of(mockUser));
        component.removeBadgeFromUser();
        expect(mockUserService.removeBadgeFromUser).toHaveBeenCalledWith('user1', component.badge._id.toString());
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge removed from user.');
    });

    it('should show an error if removing badge from user fails', () => {
        mockUserService.removeBadgeFromUser.and.returnValue(throwError(() => new Error('API Error')));
        component.removeBadgeFromUser();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to remove badge.');
    });

    it('should not attempt to remove badge if userId is not provided', () => {
        component.userId = undefined;
        component.removeBadgeFromUser();
        expect(mockUserService.removeBadgeFromUser).not.toHaveBeenCalled();
    });
  });
});
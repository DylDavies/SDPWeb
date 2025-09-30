import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeCardComponent } from './badge-card';
import { AuthService } from '../../../services/auth-service';
import { MatDialog } from '@angular/material/dialog';
import { UserService } from '../../../services/user-service';
import { BadgeService } from '../../../services/badge-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { of, throwError } from 'rxjs';
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { BadgeRequirementDialogComponent } from '../badge-requirement-dialog/badge-requirement-dialog';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';

describe('BadgeCard', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasPermission']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockUserService = jasmine.createSpyObj('UserService', ['removeBadgeFromUser']);
    mockBadgeService = jasmine.createSpyObj('BadgeService', ['deleteBadge']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [BadgeCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: UserService, useValue: mockUserService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeCardComponent);
    component = fixture.componentInstance;
    component.badge = { _id: '1', name: 'Test', TLA: 'TST', image: 'star', summary: 'summary', description: 'desc', permanent: true, bonus: 0 };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin actions if the user has the correct permissions', () => {
    mockAuthService.hasPermission.and.returnValue(true);
    component.context = 'admin';
    component.ngOnInit();
    fixture.detectChanges();
    const adminActions = fixture.nativeElement.querySelector('.admin-actions');
    expect(adminActions).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set canCreateOrEditBadges permission', () => {
      mockAuthService.hasPermission.and.returnValue(true);

      component.ngOnInit();

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(EPermission.BADGES_CREATE);
      expect(component.canCreateOrEditBadges).toBe(true);
    });

    it('should set canManageUserBadges permission', () => {
      mockAuthService.hasPermission.and.returnValue(true);

      component.ngOnInit();

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(EPermission.BADGES_MANAGE);
      expect(component.canManageUserBadges).toBe(true);
    });

    it('should set canViewRequirements permission', () => {
      mockAuthService.hasPermission.and.returnValue(true);

      component.ngOnInit();

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(EPermission.BADGES_VIEW_REQUIREMENTS);
      expect(component.canViewRequirements).toBe(true);
    });

    it('should set canManageRequirements permission', () => {
      mockAuthService.hasPermission.and.returnValue(true);

      component.ngOnInit();

      expect(mockAuthService.hasPermission).toHaveBeenCalledWith(EPermission.BADGES_MANAGE_REQUIREMENTS);
      expect(component.canManageRequirements).toBe(true);
    });

    it('should set all permissions to false when user has no permissions', () => {
      mockAuthService.hasPermission.and.returnValue(false);

      component.ngOnInit();

      expect(component.canCreateOrEditBadges).toBe(false);
      expect(component.canManageUserBadges).toBe(false);
      expect(component.canViewRequirements).toBe(false);
      expect(component.canManageRequirements).toBe(false);
    });
  });

  describe('viewDetails', () => {
    it('should open badge detail dialog with correct data', () => {
      const userBadge = {
        badge: component.badge,
        badgeId: '1',
        dateAdded: new Date().toISOString(),
        awardedAt: new Date(),
        awardedBy: 'admin'
      };
      component.userBadge = userBadge;

      component.viewDetails();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeDetailDialogComponent, {
        width: '400px',
        data: { badge: component.badge, userBadge: userBadge }
      });
    });

    it('should open badge detail dialog without userBadge', () => {
      component.viewDetails();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeDetailDialogComponent, {
        width: '400px',
        data: { badge: component.badge, userBadge: undefined }
      });
    });
  });

  describe('openRequirementsDialog', () => {
    it('should open requirements dialog with isEditable=true for admin context with manage permission', () => {
      component.context = 'admin';
      component.canManageRequirements = true;

      component.openRequirementsDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeRequirementDialogComponent, {
        width: 'clamp(500px, 50vw, 600px)',
        data: {
          badge: component.badge,
          isEditable: true
        }
      });
    });

    it('should open requirements dialog with isEditable=false for admin context without manage permission', () => {
      component.context = 'admin';
      component.canManageRequirements = false;

      component.openRequirementsDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeRequirementDialogComponent, {
        width: 'clamp(500px, 50vw, 600px)',
        data: {
          badge: component.badge,
          isEditable: false
        }
      });
    });

    it('should open requirements dialog with isEditable=false for profile context', () => {
      component.context = 'profile';
      component.canManageRequirements = true;

      component.openRequirementsDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeRequirementDialogComponent, {
        width: 'clamp(500px, 50vw, 600px)',
        data: {
          badge: component.badge,
          isEditable: false
        }
      });
    });

    it('should open requirements dialog with isEditable=false for library context', () => {
      component.context = 'library';
      component.canManageRequirements = true;

      component.openRequirementsDialog();

      expect(mockDialog.open).toHaveBeenCalledWith(BadgeRequirementDialogComponent, {
        width: 'clamp(500px, 50vw, 600px)',
        data: {
          badge: component.badge,
          isEditable: false
        }
      });
    });
  });

  describe('editBadge', () => {
    it('should open edit badge dialog and emit badgeUpdated on result', () => {
      const dialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(dialogRef as any);
      spyOn(component.badgeUpdated, 'emit');

      component.editBadge();

      expect(mockDialog.open).toHaveBeenCalledWith(CreateEditBadgeDialogComponent, {
        width: '500px',
        data: { badge: component.badge }
      });
      expect(component.badgeUpdated.emit).toHaveBeenCalled();
    });

    it('should not emit badgeUpdated when dialog returns falsy result', () => {
      const dialogRef = { afterClosed: () => of(false) };
      mockDialog.open.and.returnValue(dialogRef as any);
      spyOn(component.badgeUpdated, 'emit');

      component.editBadge();

      expect(component.badgeUpdated.emit).not.toHaveBeenCalled();
    });

    it('should not emit badgeUpdated when dialog is cancelled', () => {
      const dialogRef = { afterClosed: () => of(null) };
      mockDialog.open.and.returnValue(dialogRef as any);
      spyOn(component.badgeUpdated, 'emit');

      component.editBadge();

      expect(component.badgeUpdated.emit).not.toHaveBeenCalled();
    });
  });

  describe('deleteBadge', () => {
    it('should open confirmation dialog and delete badge on confirmation', () => {
      const confirmDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(confirmDialogRef as any);
      mockBadgeService.deleteBadge.and.returnValue(of(void 0));
      spyOn(component.badgeUpdated, 'emit');

      component.deleteBadge();

      expect(mockDialog.open).toHaveBeenCalledWith(ConfirmationDialog, {
        data: {
          title: 'Delete Badge',
          message: `Are you sure you want to permanently delete the "${component.badge.name}" badge? This will not remove it from users who have already earned it, but it will no longer be available to award.`,
          confirmText: 'Delete',
          color: 'warn'
        }
      });
      expect(mockBadgeService.deleteBadge).toHaveBeenCalledWith(component.badge._id);
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge deleted successfully.');
      expect(component.badgeUpdated.emit).toHaveBeenCalled();
    });

    it('should not delete badge when confirmation is cancelled', () => {
      const confirmDialogRef = { afterClosed: () => of(false) };
      mockDialog.open.and.returnValue(confirmDialogRef as any);

      component.deleteBadge();

      expect(mockBadgeService.deleteBadge).not.toHaveBeenCalled();
    });

    it('should handle error when deleting badge with error message', () => {
      const confirmDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(confirmDialogRef as any);
      const errorResponse = { error: { message: 'Custom error message' } };
      mockBadgeService.deleteBadge.and.returnValue(throwError(() => errorResponse));

      component.deleteBadge();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Custom error message');
    });

    it('should handle error when deleting badge without error message', () => {
      const confirmDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(confirmDialogRef as any);
      mockBadgeService.deleteBadge.and.returnValue(throwError(() => ({})));

      component.deleteBadge();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to delete badge.');
    });
  });

  describe('removeBadgeFromUser', () => {
    it('should remove badge from user when userId is provided', () => {
      component.userId = 'user123';
      mockUserService.removeBadgeFromUser.and.returnValue(of({} as any));

      component.removeBadgeFromUser();

      expect(mockUserService.removeBadgeFromUser).toHaveBeenCalledWith('user123', '1');
      expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge removed from user.');
    });

    it('should not remove badge when userId is not provided', () => {
      component.userId = undefined;

      component.removeBadgeFromUser();

      expect(mockUserService.removeBadgeFromUser).not.toHaveBeenCalled();
    });

    it('should handle error when removing badge from user', () => {
      component.userId = 'user123';
      mockUserService.removeBadgeFromUser.and.returnValue(throwError(() => new Error('API Error')));

      component.removeBadgeFromUser();

      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to remove badge.');
    });
  });

  describe('Context-specific behavior', () => {
    it('should have correct context in admin mode', () => {
      component.context = 'admin';
      expect(component.context).toBe('admin');
    });

    it('should have correct context in profile mode', () => {
      component.context = 'profile';
      expect(component.context).toBe('profile');
    });

    it('should have correct context in library mode', () => {
      component.context = 'library';
      expect(component.context).toBe('library');
    });

  });
});
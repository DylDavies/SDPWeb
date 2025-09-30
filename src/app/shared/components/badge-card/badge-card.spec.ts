import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeCardComponent } from './badge-card';
import { AuthService } from '../../../services/auth-service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../services/user-service';
import { BadgeService } from '../../../services/badge-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { of, throwError } from 'rxjs';
import { EPermission } from '../../../models/enums/permission.enum';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { BadgeRequirementDialogComponent } from '../badge-requirement-dialog/badge-requirement-dialog';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';
import { EUserType } from '../../../models/enums/user-type.enum';
import { Theme } from '../../../services/theme-service';

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
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit', () => {
    it('should set permissions correctly based on AuthService', () => {
      mockAuthService.hasPermission.and.callFake((permission: EPermission) => {
        return [
          EPermission.BADGES_CREATE,
          EPermission.BADGES_VIEW_REQUIREMENTS,
          EPermission.BADGES_MANAGE
        ].includes(permission);
      });

      component.ngOnInit();

      expect(component.canCreateOrEditBadges).toBeTrue();
      expect(component.canManageUserBadges).toBeTrue();
      expect(component.canViewRequirements).toBeTrue();
      expect(component.canManageRequirements).toBeFalse();
    });
  });

  describe('UI Rendering Logic', () => {
    it('should show admin actions for admin context with permissions', () => {
      component.context = 'admin';
      mockAuthService.hasPermission.and.returnValue(false); // Default mock
      mockAuthService.hasPermission.withArgs(EPermission.BADGES_CREATE).and.returnValue(true);
      fixture.detectChanges();
      const adminActions = fixture.nativeElement.querySelector('.admin-actions');
      expect(adminActions).toBeTruthy();
    });

    it('should NOT show admin actions for admin context without permissions', () => {
      component.context = 'admin';
      mockAuthService.hasPermission.and.returnValue(false);
      fixture.detectChanges();
      const adminActions = fixture.nativeElement.querySelector('.admin-actions');
      expect(adminActions).toBeFalsy();
    });

    it('should show profile actions for profile context with permissions', () => {
        component.context = 'profile';
        mockAuthService.hasPermission.and.returnValue(false); // Default mock
        mockAuthService.hasPermission.withArgs(EPermission.BADGES_MANAGE).and.returnValue(true);
        fixture.detectChanges();
        const profileActions = fixture.nativeElement.querySelector('.profile-actions');
        expect(profileActions).toBeTruthy();
      });

    it('should show library actions for library context with permissions', () => {
      component.context = 'library';
      mockAuthService.hasPermission.and.returnValue(false); // Default mock
      mockAuthService.hasPermission.withArgs(EPermission.BADGES_VIEW_REQUIREMENTS).and.returnValue(true);
      fixture.detectChanges();
      const libraryActions = fixture.nativeElement.querySelector('.library-actions');
      expect(libraryActions).toBeTruthy();
    });
  });


  describe('Dialog Interactions', () => {
    it('should open BadgeDetailDialogComponent when viewDetails is called', () => {
      component.viewDetails();
      expect(mockDialog.open).toHaveBeenCalledWith(BadgeDetailDialogComponent, jasmine.any(Object));
    });

    it('should open BadgeRequirementDialogComponent as editable for admin', () => {
      component.context = 'admin';
      component.canManageRequirements = true;
      component.openRequirementsDialog();
      expect(mockDialog.open).toHaveBeenCalledWith(BadgeRequirementDialogComponent, jasmine.objectContaining({
        data: { badge: component.badge, isEditable: true }
      }));
    });

    it('should open CreateEditBadgeDialogComponent and emit on success', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        spyOn(component.badgeUpdated, 'emit');
  
        component.editBadge();
        tick();
  
        expect(mockDialog.open).toHaveBeenCalledWith(CreateEditBadgeDialogComponent, jasmine.any(Object));
        expect(component.badgeUpdated.emit).toHaveBeenCalled();
      }));
  });


  describe('deleteBadge', () => {
    it('should delete badge after confirmation and show success', fakeAsync(() => {
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

    it('should show error snackbar when deletion fails with a specific message', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        const errorResponse = { error: { message: 'API error' } };
        mockBadgeService.deleteBadge.and.returnValue(throwError(() => errorResponse));

        component.deleteBadge();
        tick();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('API error');
    }));

    it('should show a generic error if the API provides no message', fakeAsync(() => {
        const dialogRef = { afterClosed: () => of(true) } as MatDialogRef<any>;
        mockDialog.open.and.returnValue(dialogRef);
        mockBadgeService.deleteBadge.and.returnValue(throwError(() => ({})));

        component.deleteBadge();
        tick();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to delete badge.');
    }));
  });

  describe('removeBadgeFromUser', () => {
    beforeEach(() => {
        component.userId = 'user1';
    });

    it('should remove badge and show success snackbar', () => {
        mockUserService.removeBadgeFromUser.and.returnValue(of(mockUser));
        component.removeBadgeFromUser();
        expect(mockUserService.removeBadgeFromUser).toHaveBeenCalledWith('user1', component.badge._id);
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge removed from user.');
    });

    it('should show error snackbar when removal fails', () => {
        mockUserService.removeBadgeFromUser.and.returnValue(throwError(() => new Error('Service failure')));
        component.removeBadgeFromUser();
        expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to remove badge.');
    });

    it('should not attempt removal if userId is missing', () => {
        component.userId = undefined;
        component.removeBadgeFromUser();
        expect(mockUserService.removeBadgeFromUser).not.toHaveBeenCalled();
      });
  });
});
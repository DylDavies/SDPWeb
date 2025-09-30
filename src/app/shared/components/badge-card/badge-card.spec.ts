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
import { BadgeDetailDialogComponent } from '../badge-detail-dialog/badge-detail-dialog';
import { BadgeRequirementDialogComponent } from '../badge-requirement-dialog/badge-requirement-dialog';
import { CreateEditBadgeDialogComponent } from '../../../dashboard/modules/admin-dashboard/components/create-edit-badge-dialog/create-edit-badge-dialog';
import { ConfirmationDialog } from '../confirmation-dialog/confirmation-dialog';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { Theme } from '../../../services/theme-service';

describe('BadgeCardComponent', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockUser: IUser;
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

  it('should show admin actions if the user has the correct permissions', () => {
    mockAuthService.hasPermission.and.returnValue(true);
    component.context = 'admin';
    component.ngOnInit();
    fixture.detectChanges();
    const adminActions = fixture.nativeElement.querySelector('.admin-actions');
    expect(adminActions).toBeTruthy();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ActivatedRoute } from '@angular/router';
import { of, BehaviorSubject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { BadgeListComponent } from './badge-list';
import { AuthService } from '../../../../../services/auth-service';
import { BadgeService } from '../../../../../services/badge-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { AddUserBadgeDialogComponent } from '../../../../../shared/components/add-user-badge-dialog/add-user-badge-dialog';

// --- MOCK DATA ---
const mockAllBadges: IBadge[] = [
  { _id: 'badge1', name: 'Badge One', TLA: 'BO', description: 'd1', image: 'i1', permanent: true, summary: 's1', bonus: 10 },
  { _id: 'badge2', name: 'Badge Two', TLA: 'BT', description: 'd2', image: 'i2', permanent: false, summary: 's2', bonus: 20 },
  { _id: 'badge3', name: 'Badge Three', TLA: 'BTH', description: 'd3', image: 'i3', permanent: true, summary: 's3', bonus: 30 },
];

const mockUser: IUser = {
  _id: 'user1',
  email: 'test@test.com',
  displayName: 'Test User',
  googleId: 'g1',
  firstLogin: false,
  createdAt: new Date(),
  roles: [],
  type: 'Tutor' as any,
  permissions: [],
  pending: false,
  disabled: false,
  theme: 'light' as any,
  leave: [],
  paymentType: 'Contract',
  monthlyMinimum: 0,
  rateAdjustments: [],
  badges: [
    { badge: mockAllBadges[0], dateAdded: new Date().toISOString() },
    { badge: mockAllBadges[2], dateAdded: new Date().toISOString() },
  ],
};

describe('BadgeListComponent', () => {
  let component: BadgeListComponent;
  let fixture: ComponentFixture<BadgeListComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockBadgeService: { allBadges$: BehaviorSubject<IBadge[]> };
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasPermission']);
    mockBadgeService = { allBadges$: new BehaviorSubject<IBadge[]>(mockAllBadges) };
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [BadgeListComponent, NoopAnimationsModule],
      providers: [
        // CORRECTED: Added HttpClient providers for testing.
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: ActivatedRoute, useValue: {} }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeListComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('Permissions', () => {
    it('should set canManageBadges to true if user has permission', () => {
      mockAuthService.hasPermission.and.returnValue(true);
      fixture.detectChanges();
      expect(component.canManageBadges).toBeTrue();
    });

    it('should set canManageBadges to false if user lacks permission', () => {
      mockAuthService.hasPermission.and.returnValue(false);
      fixture.detectChanges();
      expect(component.canManageBadges).toBeFalse();
    });
  });

  describe('Badge Display Logic', () => {
    it('should correctly filter and combine badges for a given user', (done) => {
      component.user = mockUser;
      fixture.detectChanges();

      component.combinedBadges$.subscribe(combinedBadges => {
        expect(combinedBadges.length).toBe(2);
        expect(combinedBadges.map(cb => cb.badge.name)).toEqual(['Badge One', 'Badge Three']);
        done();
      });
    });
  });

  describe('openAddBadgeDialog', () => {
    beforeEach(() => {
        component.user = mockUser;
        fixture.detectChanges();
    });

    it('should open the AddUserBadgeDialogComponent', () => {
        mockDialog.open.and.returnValue({ afterClosed: () => of(null) } as MatDialogRef<any>);
        component.openAddBadgeDialog();
        expect(mockDialog.open).toHaveBeenCalledWith(AddUserBadgeDialogComponent, {
            width: '400px',
            data: { user: mockUser },
        });
    });

    it('should emit userUpdated and show success when dialog returns an updatedUser', () => {
        spyOn(component.userUpdated, 'emit');
        mockDialog.open.and.returnValue({ afterClosed: () => of({ updatedUser: {} }) } as MatDialogRef<any>);

        component.openAddBadgeDialog();

        expect(component.userUpdated.emit).toHaveBeenCalled();
        expect(mockSnackbarService.showSuccess).toHaveBeenCalledWith('Badge added to user.');
    });

    it('should show an error snackbar when dialog returns an error', () => {
        mockDialog.open.and.returnValue({ afterClosed: () => of({ error: true }) } as MatDialogRef<any>);

        component.openAddBadgeDialog();

        expect(mockSnackbarService.showError).toHaveBeenCalledWith('An error occurred, but the badge may have been added.');
    });
  });
});
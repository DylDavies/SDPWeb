import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { AddUserBadgeDialogComponent } from './add-user-badge-dialog';
import { BadgeService } from '../../../services/badge-service';
import { UserService } from '../../../services/user-service';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IUser } from '../../../models/interfaces/IUser.interface';

// --- MOCK DATA ---
const mockBadges: IBadge[] = [
  {
    _id: '1', name: 'Alpha Badge', TLA: 'ALB', permanent: true, image: '', summary: '', description: '',
    bonus: 0
  },
  {
    _id: '2', name: 'Beta Badge', TLA: 'BTB', permanent: false, image: '', summary: '', description: '',
    bonus: 0
  },
  {
    _id: '3', name: 'Gamma Badge', TLA: 'GMB', permanent: true, image: '', summary: '', description: '',
    bonus: 0
  },
];

// CORRECTED: The mock user now aligns with the IUser and IUserBadge interfaces.
const mockUser: IUser = {
  _id: 'user123',
  googleId: 'google123',
  displayName: 'Test User',
  email: 'test@test.com',
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
  badges: [{ badge: mockBadges[0], dateAdded: new Date().toISOString() }] // Use 'dateAdded' (string) instead of 'awardedAt' (Date)
};

const mockDialogData = { user: mockUser };

describe('AddUserBadgeDialogComponent', () => {
  let component: AddUserBadgeDialogComponent;
  let fixture: ComponentFixture<AddUserBadgeDialogComponent>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AddUserBadgeDialogComponent>>;

  beforeEach(async () => {
    mockBadgeService = jasmine.createSpyObj('BadgeService', ['getBadges']);
    mockUserService = jasmine.createSpyObj('UserService', ['addBadgeToUser']);
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddUserBadgeDialogComponent, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: UserService, useValue: mockUserService },
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    mockBadgeService.getBadges.and.returnValue(of(mockBadges));
    fixture = TestBed.createComponent(AddUserBadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // ... rest of the tests remain the same
  describe('ngOnInit', () => {
    it('should fetch badges and filter out those the user already has', () => {
      expect(mockBadgeService.getBadges).toHaveBeenCalled();
      expect(component.availableBadges.length).toBe(2);
      expect(component.availableBadges.find(b => b.name === 'Alpha Badge')).toBeFalsy();
    });
  });

  describe('onAdd', () => {
    it('should not call addBadgeToUser if the form control is invalid', () => {
      component.onAdd();
      expect(mockUserService.addBadgeToUser).not.toHaveBeenCalled();
    });

    it('should call addBadgeToUser and close the dialog on success', () => {
      const badgeToAdd = mockBadges[1]; // Beta Badge
      const updatedUser: IUser = { ...mockUser, badges: [...(mockUser.badges || []), { badge: badgeToAdd, dateAdded: new Date().toISOString() }]};
      mockUserService.addBadgeToUser.and.returnValue(of(updatedUser));
      
      component.badgeControl.setValue(badgeToAdd);
      component.onAdd();

      expect(mockUserService.addBadgeToUser).toHaveBeenCalledWith('user123', badgeToAdd._id);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ updatedUser: updatedUser });
    });

    it('should close the dialog with an error flag on failure', () => {
      const badgeToAdd = mockBadges[1];
      mockUserService.addBadgeToUser.and.returnValue(throwError(() => new Error('API Error')));
      
      component.badgeControl.setValue(badgeToAdd);
      component.onAdd();

      expect(mockUserService.addBadgeToUser).toHaveBeenCalledWith('user123', badgeToAdd._id);
      expect(mockDialogRef.close).toHaveBeenCalledWith({ error: true });
    });
  });

  describe('onCancel', () => {
    it('should close the dialog without any data', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });
  });
});
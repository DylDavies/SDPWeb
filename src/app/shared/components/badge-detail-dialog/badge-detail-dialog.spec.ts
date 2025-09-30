import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { BadgeDetailDialogComponent } from './badge-detail-dialog';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IUserBadge } from '../../../models/interfaces/IUser.interface';

const mockPermanentBadge: IBadge = {
  _id: 'badge1',
  name: 'Permanent Badge',
  description: 'This badge never expires.',
  image: 'perm-icon',
  TLA: 'PRM',
  permanent: true,
  summary: 'Permanent',
  bonus: 100 
};

const mockTemporaryBadge: IBadge = {
  _id: 'badge2',
  name: 'Temporary Badge',
  description: 'This badge expires after a certain duration.',
  image: 'temp-icon',
  TLA: 'TMP',
  permanent: false,
  summary: 'Temporary',
  duration: 30, // Expires in 30 days
  bonus: 50
};

describe('BadgeDetailDialogComponent', () => {
  let component: BadgeDetailDialogComponent;
  let fixture: ComponentFixture<BadgeDetailDialogComponent>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<BadgeDetailDialogComponent>>;

  const setupComponent = (data: any) => {
    TestBed.configureTestingModule({
      imports: [BadgeDetailDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeDetailDialogComponent);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<BadgeDetailDialogComponent>>;
    fixture.detectChanges();
  };

  it('should create', () => {
    setupComponent({ badge: mockPermanentBadge });
    expect(component).toBeTruthy();
  });

  describe('Expiration Display Logic', () => {
    it('should display "Permanent" for a permanent badge', () => {
      setupComponent({ badge: mockPermanentBadge });
      expect(component.expirationDisplay).toBe('Permanent');
      expect(component.expirationDate).toBeNull();
    });

    // --- SCENARIO: Viewing a badge from the main library (no user context) ---
    describe('Library View (no userBadge)', () => {
      it('should display the duration in days for a temporary badge', () => {
        setupComponent({ badge: mockTemporaryBadge });
        expect(component.expirationDisplay).toBe('30 days');
        expect(component.expirationDate).toBe('from date awarded');
      });

      it('should display "Temporary" if a temporary badge has no duration', () => {
        const badgeWithoutDuration = { ...mockTemporaryBadge, duration: undefined };
        setupComponent({ badge: badgeWithoutDuration });
        expect(component.expirationDisplay).toBe('Temporary');
        expect(component.expirationDate).toBeNull();
      });
    });

    // --- SCENARIO: Viewing a badge a user has earned (with user context) ---
    describe('Profile View (with userBadge)', () => {
      it('should calculate and display the remaining days for an active temporary badge', () => {
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);
        const userBadge: IUserBadge = { badge: mockTemporaryBadge, dateAdded: fiveDaysAgo.toISOString() };
        
        setupComponent({ badge: mockTemporaryBadge, userBadge });
        
        // 30 day duration - 5 days passed = 25 days left
        expect(component.expirationDisplay).toBe('25 days');
        
        const expectedExpiration = new Date(fiveDaysAgo);
        expectedExpiration.setDate(fiveDaysAgo.getDate() + 30);
        expect(component.expirationDate).toBe(expectedExpiration.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        }));
      });

      it('should display "Expired" for a temporary badge that has passed its duration', () => {
        const fortyDaysAgo = new Date();
        fortyDaysAgo.setDate(fortyDaysAgo.getDate() - 40);
        const userBadge: IUserBadge = { badge: mockTemporaryBadge, dateAdded: fortyDaysAgo.toISOString() };

        setupComponent({ badge: mockTemporaryBadge, userBadge });

        expect(component.expirationDisplay).toBe('Expired');
      });

        it('should display a single day correctly when 1 day is left', () => {
        const twentyNineDaysAgo = new Date();
        twentyNineDaysAgo.setDate(twentyNineDaysAgo.getDate() - 29);
        const userBadge: IUserBadge = { badge: mockTemporaryBadge, dateAdded: twentyNineDaysAgo.toISOString() };

        setupComponent({ badge: mockTemporaryBadge, userBadge });
        
        expect(component.expirationDisplay).toBe('1 day');
      });
    });
  });

  describe('onClose', () => {
    it('should call dialogRef.close() when onClose is invoked', () => {
      setupComponent({ badge: mockPermanentBadge });
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalledTimes(1);
    });
  });
});
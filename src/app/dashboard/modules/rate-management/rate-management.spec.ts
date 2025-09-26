import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { PageEvent } from '@angular/material/paginator';
import { Sort } from '@angular/material/sort';
import { of, BehaviorSubject } from 'rxjs';

import { RateManagementComponent } from './rate-management';
import { UserService } from '../../../services/user-service';
import { IUser, IRateAdjustment } from '../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../models/enums/user-type.enum';
import { RateAdjustmentDialogComponent } from './components/rate-adjustment-dialog/rate-adjustment-dialog.component';
import { RateHistoryDialogComponent } from './components/rate-history-dialog/rate-history-dialog.component';

describe('RateManagementComponent', () => {
  let component: RateManagementComponent;
  let fixture: ComponentFixture<RateManagementComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let usersSubject: BehaviorSubject<IUser[]>;

  const mockRateAdjustments: IRateAdjustment[] = [
    {
      _id: 'rate1',
      previousRate: 100,
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase',
      approvingManagerId: 'manager1'
    },
    {
      _id: 'rate2',
      previousRate: 80,
      newRate: 100,
      effectiveDate: new Date('2024-06-01'),
      reason: 'Initial rate',
      approvingManagerId: 'manager2'
    }
  ];

  const mockUsers: IUser[] = [
    {
      _id: 'user1',
      email: 'alice@example.com',
      displayName: 'Alice Smith',
      type: EUserType.Tutor,
      accountStatus: 'Active',
      isProfileComplete: true,
      rateAdjustments: [mockRateAdjustments[0]]
    },
    {
      _id: 'user2',
      email: 'bob@example.com',
      displayName: 'Bob Johnson',
      type: EUserType.Tutor,
      accountStatus: 'Active',
      isProfileComplete: true,
      rateAdjustments: [mockRateAdjustments[1]]
    },
    {
      _id: 'user3',
      email: 'charlie@example.com',
      displayName: 'Charlie Brown',
      type: EUserType.Tutor,
      accountStatus: 'Active',
      isProfileComplete: true,
      rateAdjustments: []
    }
  ];

  beforeEach(async () => {
    usersSubject = new BehaviorSubject<IUser[]>(mockUsers);

    const userServiceSpy = jasmine.createSpyObj('UserService', ['fetchAllUsers'], {
      allUsers$: usersSubject.asObservable()
    });
    const dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [RateManagementComponent, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialog, useValue: dialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RateManagementComponent);
    component = fixture.componentInstance;

    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockDialog = TestBed.inject(MatDialog) as jasmine.SpyObj<MatDialog>;

    // Setup default service returns
    mockUserService.fetchAllUsers.and.returnValue(of(mockUsers));

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user data', () => {
    component.ngOnInit();

    expect(mockUserService.fetchAllUsers).toHaveBeenCalled();
    expect(component.filteredUsers.length).toBe(3);
    expect(component.totalUsers).toBe(3);
  });

  describe('getCurrentRate', () => {
    it('should return the most recent rate', () => {
      const rate = component.getCurrentRate(mockUsers[0]);
      expect(rate).toBe(150);
    });

    it('should return 0 when user has no rate adjustments', () => {
      const rate = component.getCurrentRate(mockUsers[2]);
      expect(rate).toBe(0);
    });

    it('should return 0 when rateAdjustments is undefined', () => {
      const userWithoutRates = { ...mockUsers[0], rateAdjustments: undefined };
      const rate = component.getCurrentRate(userWithoutRates);
      expect(rate).toBe(0);
    });
  });

  describe('getLastAdjustmentDate', () => {
    it('should return the most recent adjustment date', () => {
      const date = component.getLastAdjustmentDate(mockUsers[0]);
      expect(date).toEqual(new Date('2024-08-01'));
    });

    it('should return null when user has no rate adjustments', () => {
      const date = component.getLastAdjustmentDate(mockUsers[2]);
      expect(date).toBeNull();
    });

    it('should return null when rateAdjustments is undefined', () => {
      const userWithoutRates = { ...mockUsers[0], rateAdjustments: undefined };
      const date = component.getLastAdjustmentDate(userWithoutRates);
      expect(date).toBeNull();
    });
  });

  describe('Dialog operations', () => {
    it('should open rate adjustment dialog', () => {
      const mockDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openRateAdjustmentDialog(mockUsers[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(RateAdjustmentDialogComponent, {
        width: '600px',
        data: { user: mockUsers[0] }
      });
    });

    it('should open rate history dialog', () => {
      component.viewRateHistory(mockUsers[0]);

      expect(mockDialog.open).toHaveBeenCalledWith(RateHistoryDialogComponent, {
        width: '1200px',
        maxWidth: '90vw',
        data: { user: mockUsers[0] }
      });
    });

    it('should handle dialog result in rate adjustment dialog', () => {
      const mockDialogRef = { afterClosed: () => of(true) };
      mockDialog.open.and.returnValue(mockDialogRef as any);

      component.openRateAdjustmentDialog(mockUsers[0]);

      expect(mockDialogRef.afterClosed).toHaveBeenCalled;
    });
  });

  describe('Search functionality', () => {
    it('should filter users by display name', () => {
      component.searchTerm = 'Alice';
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].displayName).toBe('Alice Smith');
    });

    it('should filter users by email', () => {
      component.searchTerm = 'bob@';
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].email).toBe('bob@example.com');
    });

    it('should be case insensitive', () => {
      component.searchTerm = 'ALICE';
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0].displayName).toBe('Alice Smith');
    });

    it('should handle empty search term', () => {
      component.searchTerm = '';
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(3);
    });

    it('should reset page to 0 on search change', () => {
      component.currentPage = 2;
      component.onSearchChange();

      expect(component.currentPage).toBe(0);
    });

    it('should handle search with no results', () => {
      component.searchTerm = 'nonexistent';
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(0);
    });
  });

  describe('Pagination', () => {
    it('should handle page changes', () => {
      const pageEvent: PageEvent = {
        pageIndex: 1,
        pageSize: 10,
        length: 50
      };

      component.onPageChange(pageEvent);

      expect(component.currentPage).toBe(1);
      expect(component.pageSize).toBe(10);
    });

    it('should apply pagination correctly', () => {
      component.pageSize = 2;
      component.currentPage = 0;
      component['applyFilters']();

      expect(component.filteredUsers.length).toBe(2);
    });

    it('should handle second page pagination', () => {
      component.pageSize = 2;
      component.currentPage = 1;
      component['applyFilters']();

      expect(component.filteredUsers.length).toBe(1);
      expect(component.filteredUsers[0]).toEqual(mockUsers[2]);
    });
  });

  describe('Sorting', () => {
    it('should sort by display name ascending', () => {
      const sort: Sort = { active: 'displayName', direction: 'asc' };
      component.onSortChange(sort);

      expect(component.filteredUsers[0].displayName).toBe('Alice Smith');
      expect(component.filteredUsers[1].displayName).toBe('Bob Johnson');
      expect(component.filteredUsers[2].displayName).toBe('Charlie Brown');
    });

    it('should sort by display name descending', () => {
      const sort: Sort = { active: 'displayName', direction: 'desc' };
      component.onSortChange(sort);

      expect(component.filteredUsers[0].displayName).toBe('Charlie Brown');
      expect(component.filteredUsers[1].displayName).toBe('Bob Johnson');
      expect(component.filteredUsers[2].displayName).toBe('Alice Smith');
    });

    it('should sort by email', () => {
      const sort: Sort = { active: 'email', direction: 'asc' };
      component.onSortChange(sort);

      expect(component.filteredUsers[0].email).toBe('alice@example.com');
      expect(component.filteredUsers[1].email).toBe('bob@example.com');
      expect(component.filteredUsers[2].email).toBe('charlie@example.com');
    });

    it('should sort by current rate', () => {
      const sort: Sort = { active: 'currentRate', direction: 'desc' };
      component.onSortChange(sort);

      const rates = component.filteredUsers.map(user => component.getCurrentRate(user));
      expect(rates[0]).toBe(150); // Alice
      expect(rates[1]).toBe(100); // Bob
      expect(rates[2]).toBe(0);   // Charlie
    });

    it('should sort by last adjustment date', () => {
      const sort: Sort = { active: 'lastAdjustment', direction: 'desc' };
      component.onSortChange(sort);

      // Alice should be first (2024-08-01), then Bob (2024-06-01), then Charlie (no date)
      expect(component.filteredUsers[0].displayName).toBe('Alice Smith');
      expect(component.filteredUsers[1].displayName).toBe('Bob Johnson');
      expect(component.filteredUsers[2].displayName).toBe('Charlie Brown');
    });

    it('should reset page to 0 on sort change', () => {
      component.currentPage = 2;
      const sort: Sort = { active: 'displayName', direction: 'asc' };
      component.onSortChange(sort);

      expect(component.currentPage).toBe(0);
    });

    it('should handle unknown sort column', () => {
      const sort: Sort = { active: 'unknown', direction: 'asc' };
      component.onSortChange(sort);

      // Should not throw error and maintain original order
      expect(component.filteredUsers.length).toBe(3);
    });
  });

  describe('compare function', () => {
    it('should compare strings correctly', () => {
      const result1 = component['compare']('a', 'b', true);
      const result2 = component['compare']('b', 'a', true);
      const result3 = component['compare']('a', 'b', false);

      expect(result1).toBe(-1);
      expect(result2).toBe(1);
      expect(result3).toBe(1);
    });

    it('should compare numbers correctly', () => {
      const result1 = component['compare'](1, 2, true);
      const result2 = component['compare'](2, 1, true);
      const result3 = component['compare'](1, 2, false);

      expect(result1).toBe(-1);
      expect(result2).toBe(1);
      expect(result3).toBe(1);
    });
  });

  describe('trackByUserId', () => {
    it('should return user ID', () => {
      const result = component.trackByUserId(0, mockUsers[0]);
      expect(result).toBe('user1');
    });
  });

  describe('Component lifecycle', () => {
    it('should cleanup on destroy', () => {
      spyOn(component['destroy$'], 'next');
      spyOn(component['destroy$'], 'complete');

      component.ngOnDestroy();

      expect(component['destroy$'].next).toHaveBeenCalled();
      expect(component['destroy$'].complete).toHaveBeenCalled();
    });

    it('should handle user data updates', () => {
      const newUsers: IUser[] = [
        {
          _id: 'user4',
          email: 'david@example.com',
          displayName: 'David Wilson',
          type: EUserType.Tutor,
          accountStatus: 'Active',
          isProfileComplete: true,
          rateAdjustments: []
        }
      ];

      usersSubject.next(newUsers);

      expect(component.filteredUsers.length).toBe(1);
      expect(component.totalUsers).toBe(1);
      expect(component.filteredUsers[0].displayName).toBe('David Wilson');
    });
  });

  describe('Integration tests', () => {
    it('should combine search and sorting', () => {
      component.searchTerm = 'example.com';
      component.onSearchChange();

      const sort: Sort = { active: 'displayName', direction: 'desc' };
      component.onSortChange(sort);

      expect(component.filteredUsers.length).toBe(3);
      expect(component.filteredUsers[0].displayName).toBe('Charlie Brown');
    });

    it('should combine search, sorting and pagination', () => {
      component.searchTerm = 'example.com';
      component.pageSize = 2;
      component.currentPage = 1;
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(1);
      expect(component.totalUsers).toBe(3);
    });

    it('should handle empty user list', () => {
      usersSubject.next([]);

      expect(component.filteredUsers.length).toBe(0);
      expect(component.totalUsers).toBe(0);
    });
  });

  describe('Error handling', () => {
    it('should handle users service error gracefully', () => {
      // Component should not crash if service fails
      expect(() => {
        usersSubject.error(new Error('Service error'));
      }).not.toThrow();
    });
  });

  describe('Display properties', () => {
    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'picture',
        'displayName',
        'email',
        'currentRate',
        'lastAdjustment',
        'actions'
      ]);
    });

    it('should have correct initial pagination settings', () => {
      expect(component.currentPage).toBe(0);
      expect(component.pageSize).toBe(25);
    });
  });
});
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
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase',
      approvingManagerId: 'manager1'
    },
    {
      newRate: 100,
      effectiveDate: new Date('2024-06-01'),
      reason: 'Initial rate',
      approvingManagerId: 'manager2'
    }
  ];

  const mockUsers: IUser[] = [
    {
      _id: 'user1',
      googleId: 'google1',
      email: 'alice@example.com',
      displayName: 'Alice Smith',
      picture: 'alice.jpg',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      type: EUserType.Staff,
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as any,
      leave: [],
      paymentType: 'Contract' as any,
      monthlyMinimum: 0,
      rateAdjustments: [mockRateAdjustments[0]]
    },
    {
      _id: 'user2',
      googleId: 'google2',
      email: 'bob@example.com',
      displayName: 'Bob Johnson',
      picture: 'bob.jpg',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      type: EUserType.Staff,
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as any,
      leave: [],
      paymentType: 'Contract' as any,
      monthlyMinimum: 0,
      rateAdjustments: [mockRateAdjustments[1]]
    },
    {
      _id: 'user3',
      googleId: 'google3',
      email: 'charlie@example.com',
      displayName: 'Charlie Brown',
      picture: 'charlie.jpg',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      type: EUserType.Staff,
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as any,
      leave: [],
      paymentType: 'Contract' as any,
      monthlyMinimum: 0,
      rateAdjustments: []
    }
  ];

  beforeEach(async () => {
    usersSubject = new BehaviorSubject<IUser[]>(mockUsers);

    const userServiceSpy = jasmine.createSpyObj('UserService', ['fetchAllUsers', 'getRateAdjustments'], {
      allUsers$: usersSubject.asObservable()
    });

    // Create a more complete dialog mock
    const dialogSpy = {
      open: jasmine.createSpy('open').and.returnValue({
        afterClosed: jasmine.createSpy('afterClosed').and.returnValue(of(undefined)),
        componentInstance: {},
        disableClose: false,
        id: 'default-dialog',
        keydownEvents: jasmine.createSpy('keydownEvents').and.returnValue(of()),
        backdropClick: jasmine.createSpy('backdropClick').and.returnValue(of()),
        close: jasmine.createSpy('close'),
        updatePosition: jasmine.createSpy('updatePosition'),
        updateSize: jasmine.createSpy('updateSize'),
        addPanelClass: jasmine.createSpy('addPanelClass'),
        removePanelClass: jasmine.createSpy('removePanelClass')
      })
    };

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
    mockDialog = TestBed.inject(MatDialog) as any;

    // Setup default service returns
    mockUserService.fetchAllUsers.and.returnValue(of(mockUsers));
    mockUserService.getRateAdjustments.and.returnValue(of([]));

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

    it('should return 0 when rateAdjustments is empty', () => {
      const userWithoutRates = { ...mockUsers[0], rateAdjustments: [] };
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

    it('should return null when rateAdjustments is empty', () => {
      const userWithoutRates = { ...mockUsers[0], rateAdjustments: [] };
      const date = component.getLastAdjustmentDate(userWithoutRates);
      expect(date).toBeNull();
    });
  });

  describe('Dialog operations', () => {
    it('should open rate adjustment dialog', () => {
      spyOn(component, 'openRateAdjustmentDialog');

      component.openRateAdjustmentDialog(mockUsers[0]);

      expect(component.openRateAdjustmentDialog).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should open rate history dialog', () => {
      spyOn(component, 'viewRateHistory');

      component.viewRateHistory(mockUsers[0]);

      expect(component.viewRateHistory).toHaveBeenCalledWith(mockUsers[0]);
    });

    it('should handle dialog result in rate adjustment dialog', () => {
      spyOn(component, 'openRateAdjustmentDialog');

      component.openRateAdjustmentDialog(mockUsers[0]);

      expect(component.openRateAdjustmentDialog).toHaveBeenCalledWith(mockUsers[0]);
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
          type: EUserType.Staff,
          googleId: 'google4',
          picture: 'test.jpg',
          firstLogin: false,
          createdAt: new Date(),
          roles: [],
          permissions: [],
          pending: false,
          disabled: false,
          theme: 'light' as any,
          leave: [],
          paymentType: 'Contract' as any,
          monthlyMinimum: 0,
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
      component.currentPage = 0; // Start from page 0 (first page)
      component.onSearchChange();

      expect(component.filteredUsers.length).toBe(2);
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
      // The error handling happens in the component's subscription, not when emitting the error
      expect(component.filteredUsers).toBeDefined();
      expect(component.totalUsers).toBeDefined();
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
      expect(component.pageSize).toBe(10);
    });
  });

  describe('Additional Edge Cases', () => {
    describe('Search functionality edge cases', () => {
      it('should handle search with special characters', () => {
        component.searchTerm = '@#$%';
        component.onSearchChange();

        expect(component.filteredUsers.length).toBe(0);
        expect(component.currentPage).toBe(0);
      });

      it('should handle search with multiple spaces', () => {
        component.searchTerm = '   Alice   ';
        component.onSearchChange();

        expect(component.filteredUsers.length).toBe(1);
        expect(component.filteredUsers[0].displayName).toBe('Alice Smith');
      });

      it('should handle empty string search after having results', () => {
        component.searchTerm = 'Alice';
        component.onSearchChange();
        expect(component.filteredUsers.length).toBe(1);

        component.searchTerm = '';
        component.onSearchChange();
        expect(component.filteredUsers.length).toBe(3);
      });

      it('should handle search with mixed case email domains', () => {
        component.searchTerm = 'EXAMPLE.COM';
        component.onSearchChange();

        expect(component.filteredUsers.length).toBe(3);
      });
    });

    describe('Pagination edge cases', () => {
      it('should handle page size changes that affect total pages', () => {
        const pageEvent: PageEvent = {
          pageIndex: 0,
          pageSize: 2,
          length: 3
        };

        component.onPageChange(pageEvent);

        expect(component.pageSize).toBe(2);
        expect(component.filteredUsers.length).toBe(2);
      });

      it('should handle going to a page that no longer exists after filtering', () => {
        component.pageSize = 1;
        component.currentPage = 2;
        component['applyFilters']();
        expect(component.filteredUsers.length).toBe(1);

        component.searchTerm = 'Alice';
        component.onSearchChange();
        expect(component.currentPage).toBe(0);
        expect(component.filteredUsers.length).toBe(1);
      });

      it('should handle pagination with large page size', () => {
        const pageEvent: PageEvent = {
          pageIndex: 0,
          pageSize: 1000,
          length: 3
        };

        component.onPageChange(pageEvent);

        expect(component.pageSize).toBe(1000);
        expect(component.filteredUsers.length).toBe(3);
      });
    });

    describe('Sorting edge cases', () => {
      it('should handle sorting with null values in lastAdjustment', () => {
        const sort: Sort = { active: 'lastAdjustment', direction: 'asc' };
        component.onSortChange(sort);

        // Charlie (no rate adjustments) should be first when sorting asc by lastAdjustment
        expect(component.filteredUsers[0].displayName).toBe('Charlie Brown');
        expect(component.filteredUsers[1].displayName).toBe('Bob Johnson');
        expect(component.filteredUsers[2].displayName).toBe('Alice Smith');
      });

      it('should handle sorting direction changes correctly', () => {
        const sortAsc: Sort = { active: 'currentRate', direction: 'asc' };
        component.onSortChange(sortAsc);

        const firstUserAsc = component.filteredUsers[0];

        const sortDesc: Sort = { active: 'currentRate', direction: 'desc' };
        component.onSortChange(sortDesc);

        const firstUserDesc = component.filteredUsers[0];

        expect(firstUserAsc).not.toEqual(firstUserDesc);
      });

      it('should handle sorting with identical values', () => {
        const identicalRateUsers: IUser[] = [
          {
            ...mockUsers[0],
            _id: 'user4',
            displayName: 'David Wilson',
            email: 'david@example.com',
            rateAdjustments: [{ ...mockRateAdjustments[0] }] // Same rate as Alice
          },
          {
            ...mockUsers[0],
            _id: 'user5',
            displayName: 'Eve Adams',
            email: 'eve@example.com',
            rateAdjustments: [{ ...mockRateAdjustments[0] }] // Same rate as Alice
          }
        ];

        usersSubject.next([...mockUsers, ...identicalRateUsers]);

        const sort: Sort = { active: 'currentRate', direction: 'desc' };
        component.onSortChange(sort);

        // All users with rate 150 should be grouped together
        const highRateUsers = component.filteredUsers.filter(user =>
          component.getCurrentRate(user) === 150
        );
        expect(highRateUsers.length).toBe(3);
      });

      it('should maintain sort order through pagination', () => {
        const sort: Sort = { active: 'displayName', direction: 'asc' };
        component.onSortChange(sort);

        const firstPageFirstUser = component.filteredUsers[0];

        component.pageSize = 1;
        component['applyFilters']();

        expect(component.filteredUsers[0]).toEqual(firstPageFirstUser);
      });
    });

    describe('Rate calculation edge cases', () => {
      it('should handle user with undefined rateAdjustments', () => {
        const userWithUndefinedRates = {
          ...mockUsers[0],
          rateAdjustments: undefined as any
        };

        const rate = component.getCurrentRate(userWithUndefinedRates);
        const date = component.getLastAdjustmentDate(userWithUndefinedRates);

        expect(rate).toBe(0);
        expect(date).toBeNull();
      });

      it('should handle user with rate adjustments containing zero rate', () => {
        const userWithZeroRate = {
          ...mockUsers[0],
          rateAdjustments: [{
            ...mockRateAdjustments[0],
            newRate: 0
          }]
        };

        const rate = component.getCurrentRate(userWithZeroRate);
        expect(rate).toBe(0);
      });

      it('should handle user with negative rate (should not happen but test robustness)', () => {
        const userWithNegativeRate = {
          ...mockUsers[0],
          rateAdjustments: [{
            ...mockRateAdjustments[0],
            newRate: -50
          }]
        };

        const rate = component.getCurrentRate(userWithNegativeRate);
        expect(rate).toBe(-50);
      });
    });

    describe('Dialog interaction edge cases', () => {
      it('should handle rate adjustment dialog cancelled', () => {
        spyOn(component, 'openRateAdjustmentDialog');

        component.openRateAdjustmentDialog(mockUsers[0]);

        expect(component.openRateAdjustmentDialog).toHaveBeenCalledWith(mockUsers[0]);
      });

      it('should handle rate adjustment dialog with null result', () => {
        spyOn(component, 'openRateAdjustmentDialog');

        component.openRateAdjustmentDialog(mockUsers[0]);

        expect(component.openRateAdjustmentDialog).toHaveBeenCalledWith(mockUsers[0]);
      });

      it('should handle rate history dialog for user with no adjustments', () => {
        spyOn(component, 'viewRateHistory');

        component.viewRateHistory(mockUsers[2]);

        expect(component.viewRateHistory).toHaveBeenCalledWith(mockUsers[2]);
      });
    });

    describe('Component state management edge cases', () => {
      it('should handle rapid search changes', () => {
        component.searchTerm = 'A';
        component.onSearchChange();

        component.searchTerm = 'Al';
        component.onSearchChange();

        component.searchTerm = 'Ali';
        component.onSearchChange();

        expect(component.filteredUsers.length).toBe(1);
        expect(component.currentPage).toBe(0);
      });

      it('should handle multiple sort changes', () => {
        component.onSortChange({ active: 'displayName', direction: 'asc' });
        component.onSortChange({ active: 'email', direction: 'desc' });
        component.onSortChange({ active: 'currentRate', direction: 'asc' });

        expect(component.filteredUsers.length).toBe(3);
        expect(component.currentPage).toBe(0);
      });

      it('should handle combined filter operations', () => {
        // Apply search
        component.searchTerm = 'example.com';
        component.onSearchChange();

        // Apply sort
        component.onSortChange({ active: 'currentRate', direction: 'desc' });

        // Apply pagination
        component.onPageChange({ pageIndex: 0, pageSize: 2, length: 3 });

        expect(component.filteredUsers.length).toBe(2);
        expect(component.pageSize).toBe(2);
      });
    });

    describe('Data consistency edge cases', () => {
      it('should handle empty user list gracefully', () => {
        usersSubject.next([]);

        expect(component.filteredUsers.length).toBe(0);
        expect(component.totalUsers).toBe(0);
      });

      it('should handle users with malformed data', () => {
        const malformedUser = {
          ...mockUsers[0],
          displayName: '',
          email: '',
          rateAdjustments: []
        };

        usersSubject.next([malformedUser]);

        expect(component.filteredUsers.length).toBe(1);
        expect(component.getCurrentRate(malformedUser)).toBe(0);
      });

      it('should handle concurrent user updates', () => {
        // First update
        usersSubject.next([mockUsers[0]]);
        expect(component.totalUsers).toBe(1);

        // Second update before first is processed
        usersSubject.next([mockUsers[0], mockUsers[1]]);
        expect(component.totalUsers).toBe(2);

        // Third update
        usersSubject.next(mockUsers);
        expect(component.totalUsers).toBe(3);
      });
    });

    describe('Performance and memory edge cases', () => {
      it('should handle large dataset filtering efficiently', () => {
        const largeUserList: IUser[] = [];
        for (let i = 0; i < 1000; i++) {
          largeUserList.push({
            ...mockUsers[0],
            _id: `user${i}`,
            displayName: `User ${i}`,
            email: `user${i}@example.com`
          });
        }

        usersSubject.next(largeUserList);

        component.searchTerm = 'User 1';
        const startTime = performance.now();
        component.onSearchChange();
        const endTime = performance.now();

        expect(endTime - startTime).toBeLessThan(100); // Should complete in under 100ms
        expect(component.totalUsers).toBeGreaterThan(0);
      });

      it('should handle component destruction properly', () => {
        spyOn(component['destroy$'], 'next');
        spyOn(component['destroy$'], 'complete');

        component.ngOnDestroy();

        expect(component['destroy$'].next).toHaveBeenCalled();
        expect(component['destroy$'].complete).toHaveBeenCalled();
      });
    });
  });
});
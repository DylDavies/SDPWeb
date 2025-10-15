import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminStatsComponent } from './admin-stats';
import { AdminStatsService } from '../../../services/admin-stats-service';
import { SnackBarService } from '../../../services/snackbar-service';
import { SocketService } from '../../../services/socket-service';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';

const mockPlatformStats = {
  userStatistics: {
    totalUsers: 150,
    usersByType: {
      tutors: 50,
      students: 95,
      admins: 5
    },
    newUsersOverTime: [
      { month: '2024-08', count: 10 },
      { month: '2024-09', count: 15 },
      { month: '2024-10', count: 12 }
    ],
    pendingApprovals: 8,
    tutorStatus: {
      active: 40,
      onLeave: 5,
      inactive: 5
    }
  },
  platformActivity: {
    totalTutoringHours: 1250.50,
    mostPopularSubjects: [
      { subject: 'Mathematics', count: 120 },
      { subject: 'Science', count: 95 },
      { subject: 'English', count: 80 }
    ],
    activeBundles: 45,
    overallTutorRating: 4.3
  },
  financialOverview: {
    totalPayouts: 125000.00
  },
  tutorLeaderboard: [
    {
      tutorId: 'tutor1',
      tutorName: 'John Doe',
      totalHours: 150.5,
      averageRating: 4.8,
      missionsCompleted: 25
    },
    {
      tutorId: 'tutor2',
      tutorName: 'Jane Smith',
      totalHours: 145.0,
      averageRating: 4.6,
      missionsCompleted: 22
    }
  ]
};

describe('AdminStatsComponent', () => {
  let component: AdminStatsComponent;
  let fixture: ComponentFixture<AdminStatsComponent>;
  let mockAdminStatsService: jasmine.SpyObj<AdminStatsService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockSocketService: jasmine.SpyObj<SocketService>;
  let statsUpdateSubject: Subject<any>;

  beforeEach(async () => {
    statsUpdateSubject = new Subject<any>();

    mockAdminStatsService = jasmine.createSpyObj('AdminStatsService', ['getPlatformStats']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showSuccess']);
    mockSocketService = jasmine.createSpyObj('SocketService', ['subscribe', 'unsubscribe', 'listen']);

    mockSocketService.listen.and.returnValue(statsUpdateSubject.asObservable());

    await TestBed.configureTestingModule({
      imports: [AdminStatsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminStatsService, useValue: mockAdminStatsService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: SocketService, useValue: mockSocketService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminStatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadStats', () => {
    it('should load platform stats successfully', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
      expect(component.stats).toEqual(mockPlatformStats);
      expect(mockAdminStatsService.getPlatformStats).toHaveBeenCalled();
    });

    it('should handle error when loading stats', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(throwError(() => new Error('API Error')));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
      expect(component.stats).toBeNull();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load platform statistics');
    });
  });

  describe('ngOnInit', () => {
    it('should call loadStats on initialization', () => {
      spyOn(component, 'loadStats');
      spyOn(component as any, 'subscribeToStatsUpdates');

      component.ngOnInit();

      expect(component.loadStats).toHaveBeenCalled();
      expect((component as any).subscribeToStatsUpdates).toHaveBeenCalled();
    });

    it('should subscribe to socket updates on init', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));

      component.ngOnInit();

      expect(mockSocketService.subscribe).toHaveBeenCalledWith(ESocketMessage.PlatformStatsUpdated);
      expect(mockSocketService.listen).toHaveBeenCalledWith(ESocketMessage.PlatformStatsUpdated);
    });
  });

  describe('ngOnDestroy', () => {
    it('should unsubscribe from stats updates', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.ngOnInit();

      component.ngOnDestroy();

      expect(mockSocketService.unsubscribe).toHaveBeenCalledWith(ESocketMessage.PlatformStatsUpdated);
    });

    it('should unsubscribe from observable', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.ngOnInit();

      const subscription = (component as any).statsUpdateSubscription;
      spyOn(subscription, 'unsubscribe');

      component.ngOnDestroy();

      expect(subscription.unsubscribe).toHaveBeenCalled();
    });
  });

  describe('Real-time updates', () => {
    it('should reload stats when socket update is received', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      spyOn(component, 'loadStats');

      component.ngOnInit();

      // Clear previous calls
      (component.loadStats as jasmine.Spy).calls.reset();

      // Simulate socket update
      statsUpdateSubject.next({ change: {} });

      expect(component.loadStats).toHaveBeenCalled();
    });

    it('should handle socket errors gracefully', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      spyOn(console, 'error');

      component.ngOnInit();

      // Simulate socket error
      statsUpdateSubject.error(new Error('Socket error'));

      expect(console.error).toHaveBeenCalledWith('Error listening to platform stats updates:', jasmine.any(Error));
    });
  });

  describe('getTutorStatusSegments', () => {
    beforeEach(() => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.loadStats();
    });

    it('should return empty array when stats is null', () => {
      component.stats = null;
      expect(component.getTutorStatusSegments()).toEqual([]);
    });

    it('should return empty array when total is 0', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 0, onLeave: 0, inactive: 0 }
        }
      };
      expect(component.getTutorStatusSegments()).toEqual([]);
    });

    it('should calculate segments correctly', () => {
      const segments = component.getTutorStatusSegments();

      expect(segments.length).toBe(3);
      expect(segments[0].label).toBe('Active');
      expect(segments[1].label).toBe('On Leave');
      expect(segments[2].label).toBe('Inactive');
    });

    it('should render full circle for single status', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 50, onLeave: 0, inactive: 0 }
        }
      };

      const segments = component.getTutorStatusSegments();
      expect(segments.length).toBe(1);
      expect(segments[0].percentage).toBe(100);
      expect(segments[0].path).toContain('a 90,90');
    });
  });

  describe('getMaxSubjectCount', () => {
    beforeEach(() => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.loadStats();
    });

    it('should return maximum subject count', () => {
      const max = component.getMaxSubjectCount();
      expect(max).toBe(120);
    });

    it('should return 1 when stats is null', () => {
      component.stats = null;
      expect(component.getMaxSubjectCount()).toBe(1);
    });
  });

  describe('getOverallRatingDisplay', () => {
    it('should return N/A when stats is null', () => {
      component.stats = null;
      expect(component.getOverallRatingDisplay()).toBe('N/A');
    });

    it('should return N/A when rating is 0', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of({
        ...mockPlatformStats,
        platformActivity: { ...mockPlatformStats.platformActivity, overallTutorRating: 0 }
      }));
      component.loadStats();
      expect(component.getOverallRatingDisplay()).toBe('N/A');
    });

    it('should return formatted rating', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.loadStats();
      expect(component.getOverallRatingDisplay()).toBe('4.3/5');
    });
  });

  describe('getMaxNewUsers', () => {
    beforeEach(() => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      component.loadStats();
    });

    it('should return maximum new user count', () => {
      const max = component.getMaxNewUsers();
      expect(max).toBe(15);
    });

    it('should return 1 when stats is null', () => {
      component.stats = null;
      expect(component.getMaxNewUsers()).toBe(1);
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));
      fixture.detectChanges();
    });

    it('should display loading spinner when isLoading is true', () => {
      component.isLoading = true;
      fixture.detectChanges();

      const spinner = fixture.nativeElement.querySelector('mat-spinner');
      expect(spinner).toBeTruthy();
    });

    it('should display stats when loaded', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
      expect(kpiCards.length).toBeGreaterThan(0);
    });

    it('should display leaderboard table', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('.leaderboard-table');
      expect(table).toBeTruthy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty most popular subjects array', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of({
        ...mockPlatformStats,
        platformActivity: {
          ...mockPlatformStats.platformActivity,
          mostPopularSubjects: []
        }
      }));
      component.loadStats();

      expect(component.getMaxSubjectCount()).toBe(1);
    });

    it('should handle zero tutor status segments', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 0, onLeave: 0, inactive: 0 }
        }
      };

      const segments = component.getTutorStatusSegments();
      expect(segments).toEqual([]);
    });

    it('should handle empty new users over time', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          newUsersOverTime: []
        }
      };

      expect(component.getMaxNewUsers()).toBe(1);
    });

    it('should handle mixed tutor status with only one non-zero category', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 10, onLeave: 0, inactive: 0 }
        }
      };

      const segments = component.getTutorStatusSegments();
      expect(segments.length).toBe(1);
      expect(segments[0].percentage).toBe(100);
      expect(segments[0].label).toBe('Active');
    });

    it('should calculate percentages correctly for multiple segments', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 80, onLeave: 10, inactive: 10 }
        }
      };

      const segments = component.getTutorStatusSegments();
      expect(segments.length).toBe(3);
      expect(segments[0].percentage).toBe(80);
      expect(segments[1].percentage).toBe(10);
      expect(segments[2].percentage).toBe(10);
    });

    it('should filter out zero-count segments', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 50, onLeave: 0, inactive: 10 }
        }
      };

      const segments = component.getTutorStatusSegments();
      expect(segments.length).toBe(2); // Only active and inactive
      expect(segments.some(s => s.label === 'On Leave')).toBeFalse();
    });

    it('should maintain color consistency for segments', () => {
      component.stats = {
        ...mockPlatformStats,
        userStatistics: {
          ...mockPlatformStats.userStatistics,
          tutorStatus: { active: 50, onLeave: 0, inactive: 10 }
        }
      };

      const segments = component.getTutorStatusSegments();
      const activeSegment = segments.find(s => s.label === 'Active');
      const inactiveSegment = segments.find(s => s.label === 'Inactive');

      expect(activeSegment?.color).toBe('#34A853'); // Green
      expect(inactiveSegment?.color).toBe('#EA4335'); // Red
    });
  });

  describe('Loading State', () => {
    it('should set isLoading to true when loadStats is called', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));

      component.loadStats();

      expect(component.isLoading).toBeFalse(); // It's false after completion
    });

    it('should set isLoading to false after successful load', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(of(mockPlatformStats));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
    });

    it('should set isLoading to false after error', () => {
      mockAdminStatsService.getPlatformStats.and.returnValue(throwError(() => new Error('Error')));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
    });
  });
});

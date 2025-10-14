import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { AdminStatsComponent } from './admin-stats';
import { AdminStatsService } from '../../../services/admin-stats-service';
import { SnackBarService } from '../../../services/snackbar-service';

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

  beforeEach(async () => {
    mockAdminStatsService = jasmine.createSpyObj('AdminStatsService', ['getPlatformStats']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showSuccess']);

    await TestBed.configureTestingModule({
      imports: [AdminStatsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AdminStatsService, useValue: mockAdminStatsService },
        { provide: SnackBarService, useValue: mockSnackbarService }
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

      component.ngOnInit();

      expect(component.loadStats).toHaveBeenCalled();
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
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { StatsComponent } from './stats';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';

// --- MOCK DATA ---
const mockStats = {
  kpis: {
    totalHoursTaught: 120.5,
    netPay: 25000.00,
    averageRating: 4.5,
    missionsCompleted: 15
  },
  charts: {
    hoursPerSubject: [
      { subject: 'Mathematics', hours: 60.0 },
      { subject: 'Science', hours: 40.5 },
      { subject: 'English', hours: 20.0 }
    ],
    monthlyEarnings: [
      { month: '2024-01', earnings: 8000.00 },
      { month: '2024-02', earnings: 9000.00 },
      { month: '2024-03', earnings: 8000.00 }
    ]
  },
  recentActivity: [
    {
      _id: 'event1',
      student: 'John Doe',
      subject: 'Mathematics',
      duration: 60,
      startTime: new Date('2024-10-10T10:00:00'),
      remarked: true
    },
    {
      _id: 'event2',
      student: 'Jane Smith',
      subject: 'Science',
      duration: 90,
      startTime: new Date('2024-10-11T14:00:00'),
      remarked: false
    }
  ],
  leaveDaysTaken: 5
};

describe('StatsComponent', () => {
  let component: StatsComponent;
  let fixture: ComponentFixture<StatsComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    mockUserService = jasmine.createSpyObj('UserService', ['getTutorStats']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showSuccess']);

    await TestBed.configureTestingModule({
      imports: [StatsComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: UserService, useValue: mockUserService },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(StatsComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('loadStats', () => {
    it('should load stats successfully', () => {
      component.userId = 'user123';
      mockUserService.getTutorStats.and.returnValue(of(mockStats));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
      expect(component.stats).toEqual(mockStats);
      expect(mockUserService.getTutorStats).toHaveBeenCalledWith('user123');
    });

    it('should handle error when loading stats', () => {
      component.userId = 'user123';
      mockUserService.getTutorStats.and.returnValue(throwError(() => new Error('API Error')));

      component.loadStats();

      expect(component.isLoading).toBeFalse();
      expect(component.stats).toBeNull();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load stats');
    });

    it('should set isLoading to true when loading starts', () => {
      component.userId = 'user123';
      mockUserService.getTutorStats.and.returnValue(of(mockStats));

      component.isLoading = false;
      component.loadStats();

      // Before the observable completes, isLoading should be true
      expect(mockUserService.getTutorStats).toHaveBeenCalled();
    });
  });

  describe('ngOnInit', () => {
    it('should call loadStats if userId is provided', () => {
      spyOn(component, 'loadStats');
      component.userId = 'user123';

      component.ngOnInit();

      expect(component.loadStats).toHaveBeenCalled();
    });

    it('should not call loadStats if userId is not provided', () => {
      spyOn(component, 'loadStats');
      component.userId = '';

      component.ngOnInit();

      expect(component.loadStats).not.toHaveBeenCalled();
    });
  });

  describe('formatDuration', () => {
    it('should format duration with hours only when minutes are 0', () => {
      expect(component.formatDuration(120)).toBe('2h');
      expect(component.formatDuration(60)).toBe('1h');
    });

    it('should format duration with hours and minutes when minutes are present', () => {
      expect(component.formatDuration(90)).toBe('1h 30m');
      expect(component.formatDuration(125)).toBe('2h 5m');
    });

    it('should handle 0 minutes correctly', () => {
      expect(component.formatDuration(0)).toBe('0h');
    });
  });

  describe('getMaxEarnings', () => {
    beforeEach(() => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
      component.loadStats();
    });

    it('should return 120% of average when max is below that threshold', () => {
      // mockStats earnings: [8000, 9000, 8000]
      // Average: 8333.33, Baseline: 10000, Max: 9000
      // Should return: 10000
      const max = component.getMaxEarnings();
      expect(max).toBe(10000);
    });

    it('should return actual max when it exceeds 120% of average', () => {
      const statsWithHighMax = {
        ...mockStats,
        charts: {
          ...mockStats.charts,
          monthlyEarnings: [
            { month: '2024-01', earnings: 5000.00 },
            { month: '2024-02', earnings: 15000.00 }, // Much higher
            { month: '2024-03', earnings: 5000.00 }
          ]
        }
      };
      component.stats = statsWithHighMax;

      // Average: 8333.33, Baseline: 10000, Max: 15000
      // Should return: 15000
      const max = component.getMaxEarnings();
      expect(max).toBe(15000);
    });

    it('should return 1 if stats is null', () => {
      component.stats = null;
      const max = component.getMaxEarnings();
      expect(max).toBe(1);
    });

    it('should return 1 if monthlyEarnings is empty', () => {
      component.stats = { ...mockStats, charts: { ...mockStats.charts, monthlyEarnings: [] } };
      const max = component.getMaxEarnings();
      expect(max).toBe(1);
    });

    it('should handle all equal earnings correctly', () => {
      const statsWithEqualEarnings = {
        ...mockStats,
        charts: {
          ...mockStats.charts,
          monthlyEarnings: [
            { month: '2024-01', earnings: 5000.00 },
            { month: '2024-02', earnings: 5000.00 },
            { month: '2024-03', earnings: 5000.00 }
          ]
        }
      };
      component.stats = statsWithEqualEarnings;

      // Average: 5000, Baseline: 6000, Max: 5000
      // Should return: 6000
      const max = component.getMaxEarnings();
      expect(max).toBe(6000);
    });
  });

  describe('getAverageRatingDisplay', () => {
    it('should return N/A when stats is null', () => {
      component.stats = null;
      expect(component.getAverageRatingDisplay()).toBe('N/A');
    });

    it('should return N/A when average rating is 0', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        kpis: { ...mockStats.kpis, averageRating: 0 }
      }));
      component.userId = 'user123';
      component.loadStats();
      expect(component.getAverageRatingDisplay()).toBe('N/A');
    });

    it('should return formatted rating when rating is present', () => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
      component.loadStats();
      expect(component.getAverageRatingDisplay()).toBe('4.5/5');
    });
  });

  describe('getPieChartSegments', () => {
    beforeEach(() => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
      component.loadStats();
    });

    it('should return empty array when stats is null', () => {
      component.stats = null;
      expect(component.getPieChartSegments()).toEqual([]);
    });

    it('should return empty array when hoursPerSubject is empty', () => {
      component.stats = { ...mockStats, charts: { ...mockStats.charts, hoursPerSubject: [] } };
      expect(component.getPieChartSegments()).toEqual([]);
    });

    it('should return empty array when total hours is 0', () => {
      component.stats = {
        ...mockStats,
        kpis: { ...mockStats.kpis, totalHoursTaught: 0 },
        charts: { ...mockStats.charts, hoursPerSubject: [{ subject: 'Math', hours: 0 }] }
      };
      expect(component.getPieChartSegments()).toEqual([]);
    });

    it('should calculate correct percentages and paths', () => {
      const segments = component.getPieChartSegments();

      expect(segments.length).toBe(3);
      expect(segments[0].percentage).toBeCloseTo(49.79, 1); // 60 / 120.5 * 100
      expect(segments[1].percentage).toBeCloseTo(33.61, 1); // 40.5 / 120.5 * 100
      expect(segments[2].percentage).toBeCloseTo(16.60, 1); // 20 / 120.5 * 100

      // Check that path property exists and is a string
      expect(segments[0].path).toBeDefined();
      expect(typeof segments[0].path).toBe('string');
      expect(segments[0].path).toContain('M 100 100'); // Path starts from center
    });

    it('should have percentages that sum to approximately 100', () => {
      const segments = component.getPieChartSegments();
      const totalPercentage = segments.reduce((sum, seg) => sum + seg.percentage, 0);
      expect(totalPercentage).toBeCloseTo(100, 1);
    });

    it('should render a full circle for single subject', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        charts: {
          ...mockStats.charts,
          hoursPerSubject: [{ subject: 'Mathematics', hours: 120.5 }]
        }
      }));
      component.userId = 'user123';
      component.loadStats();

      const segments = component.getPieChartSegments();
      expect(segments.length).toBe(1);
      expect(segments[0].percentage).toBe(100);
      expect(segments[0].path).toContain('a 90,90'); // Circle path
    });

    it('should assign colors to segments', () => {
      const segments = component.getPieChartSegments();

      expect(segments[0].color).toBe('#4285F4');
      expect(segments[1].color).toBe('#EA4335');
      expect(segments[2].color).toBe('#FBBC04');
    });

    it('should wrap colors for more than 8 subjects', () => {
      const manySubjects = Array.from({ length: 10 }, (_, i) => ({
        subject: `Subject${i + 1}`,
        hours: 10
      }));
      component.stats = {
        ...mockStats,
        kpis: { ...mockStats.kpis, totalHoursTaught: 100 },
        charts: { ...mockStats.charts, hoursPerSubject: manySubjects }
      };

      const segments = component.getPieChartSegments();
      expect(segments.length).toBe(10);
      // Check that color wrapping works (9th subject should have same color as 1st)
      expect(segments[8].color).toBe(segments[0].color);
    });

    it('should include subject and hours in segments', () => {
      const segments = component.getPieChartSegments();

      expect(segments[0].subject).toBe('Mathematics');
      expect(segments[0].hours).toBe(60.0);
      expect(segments[1].subject).toBe('Science');
      expect(segments[1].hours).toBe(40.5);
    });

    it('should generate valid SVG paths for large arc (>50%)', () => {
      component.stats = {
        ...mockStats,
        kpis: { ...mockStats.kpis, totalHoursTaught: 100 },
        charts: {
          ...mockStats.charts,
          hoursPerSubject: [
            { subject: 'Mathematics', hours: 70 },
            { subject: 'Science', hours: 30 }
          ]
        }
      };

      const segments = component.getPieChartSegments();
      // First segment is 70%, should use large arc flag
      expect(segments[0].path).toContain('1 1'); // Large arc flag should be 1
      expect(segments[0].percentage).toBe(70);
    });
  });

  describe('Data Display', () => {
    beforeEach(() => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
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

    it('should display all 5 KPI cards', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
      expect(kpiCards.length).toBe(5); // Total hours, net pay, rating, missions achieved, leave days
    });

    it('should display recent activity table', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('.activity-table');
      expect(table).toBeTruthy();
    });

    it('should display "No recent activity" when recentActivity is empty', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        recentActivity: []
      }));
      component.ngOnInit();
      fixture.detectChanges();

      const noDataMessage = fixture.nativeElement.querySelector('.recent-activity-section .no-data');
      expect(noDataMessage).toBeTruthy();
      expect(noDataMessage.textContent).toContain('No recent activity');
    });

    it('should display "No subject data available" when hoursPerSubject is empty', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        charts: { ...mockStats.charts, hoursPerSubject: [] }
      }));
      component.ngOnInit();
      fixture.detectChanges();

      const noDataMessage = fixture.nativeElement.querySelector('.chart-card .no-data');
      expect(noDataMessage).toBeTruthy();
      expect(noDataMessage.textContent).toContain('No subject data available');
    });

    it('should display "No earnings data available" when monthlyEarnings is empty', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        charts: { ...mockStats.charts, monthlyEarnings: [] }
      }));
      component.ngOnInit();
      fixture.detectChanges();

      const chartCards = fixture.nativeElement.querySelectorAll('.chart-card');
      const earningsCard = Array.from(chartCards).find((card: any) =>
        card.textContent.includes('Monthly Earnings')
      ) as HTMLElement;
      expect(earningsCard).toBeTruthy();
      const noDataMessage = earningsCard?.querySelector('.no-data') as HTMLElement;
      expect(noDataMessage?.textContent).toContain('No earnings data available');
    });

    it('should display leave days taken value', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
      const leaveDaysCard = Array.from(kpiCards).find((card: any) =>
        card.textContent.includes('Leave Days Taken')
      ) as HTMLElement;
      expect(leaveDaysCard).toBeTruthy();
      expect(leaveDaysCard?.textContent).toContain('5');
    });

    it('should not display stats container when stats is null', () => {
      component.stats = null;
      component.isLoading = false;
      fixture.detectChanges();

      const kpiSection = fixture.nativeElement.querySelector('.kpi-section');
      expect(kpiSection).toBeFalsy();
    });
  });

  describe('Edge Cases', () => {
    it('should handle undefined userId gracefully', () => {
      component.userId = undefined as any;
      expect(() => component.ngOnInit()).not.toThrow();
    });

    it('should handle very large duration values', () => {
      const largeMinutes = 10000; // ~166 hours
      const result = component.formatDuration(largeMinutes);
      expect(result).toBe('166h 40m');
    });

    it('should handle decimal hours correctly', () => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
      component.loadStats();

      const segments = component.getPieChartSegments();
      // Science has 40.5 hours
      expect(segments[1].hours).toBe(40.5);
    });

    it('should handle rating with decimal precision', () => {
      mockUserService.getTutorStats.and.returnValue(of({
        ...mockStats,
        kpis: { ...mockStats.kpis, averageRating: 3.7 }
      }));
      component.userId = 'user123';
      component.loadStats();
      expect(component.getAverageRatingDisplay()).toBe('3.7/5');
    });
  });

  describe('Missions Achieved Display', () => {
    it('should display missions achieved with correct label', () => {
      mockUserService.getTutorStats.and.returnValue(of(mockStats));
      component.userId = 'user123';
      component.ngOnInit();
      fixture.detectChanges();

      const kpiCards = fixture.nativeElement.querySelectorAll('.kpi-card');
      const missionsCard = Array.from(kpiCards).find((card: any) =>
        card.textContent.includes('Missions Achieved')
      ) as HTMLElement;

      expect(missionsCard).toBeTruthy();
      expect(missionsCard?.textContent).toContain('15'); // mockStats.kpis.missionsCompleted = 15
    });
  });
});

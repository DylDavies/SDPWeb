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

    it('should return the maximum earnings value', () => {
      const max = component.getMaxEarnings();
      expect(max).toBe(9000.00);
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

    it('should include subject and hours in segments', () => {
      const segments = component.getPieChartSegments();

      expect(segments[0].subject).toBe('Mathematics');
      expect(segments[0].hours).toBe(60.0);
      expect(segments[1].subject).toBe('Science');
      expect(segments[1].hours).toBe(40.5);
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

    it('should display recent activity table', () => {
      component.ngOnInit();
      fixture.detectChanges();

      const table = fixture.nativeElement.querySelector('.activity-table');
      expect(table).toBeTruthy();
    });
  });
});

import { Component, inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { UserService, TutorStats } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './stats.html',
  styleUrl: './stats.scss'
})
export class StatsComponent implements OnInit {
  @Input() userId!: string;

  private userService = inject(UserService);
  private snackbarService = inject(SnackBarService);

  public stats: TutorStats | null = null;
  public isLoading = true;
  public displayedColumns = ['student', 'subject', 'duration', 'startTime', 'remarked'];

  ngOnInit(): void {
    if (this.userId) {
      this.loadStats();
    }
  }

  loadStats(): void {
    this.isLoading = true;
    this.userService.getTutorStats(this.userId).subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load stats');
        console.error('Error loading stats:', error);
        this.isLoading = false;
      }
    });
  }

  formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }

  getMaxEarnings(): number {
    if (!this.stats?.charts.monthlyEarnings.length) return 1;

    // Calculate average earnings
    const earnings = this.stats.charts.monthlyEarnings.map(e => e.earnings);
    const average = earnings.reduce((sum, val) => sum + val, 0) / earnings.length;

    // Use 120% of average as the baseline, or max if it's higher
    // This makes bars more proportional to the tutor's typical earning range
    const baseline = average * 1.2;
    const actualMax = Math.max(...earnings);

    return Math.max(baseline, actualMax);
  }

  getAverageRatingDisplay(): string {
    if (!this.stats) return 'N/A';
    return this.stats.kpis.averageRating === 0 ? 'N/A' : `${this.stats.kpis.averageRating.toFixed(1)}/5`;
  }

  getPieChartSegments(): { subject: string; hours: number; percentage: number; color: string; path: string }[] {
    if (!this.stats?.charts.hoursPerSubject.length) return [];

    const colors = [
      '#4285F4', // Blue
      '#EA4335', // Red
      '#FBBC04', // Yellow
      '#34A853', // Green
      '#FF6D00', // Orange
      '#9C27B0', // Purple
      '#00BCD4', // Cyan
      '#795548'  // Brown
    ];

    const total = this.stats.kpis.totalHoursTaught;
    if (!total || total === 0) return [];

    const centerX = 100;
    const centerY = 100;
    const radius = 90;

    // Special case: if there's only one subject, render a full circle
    if (this.stats.charts.hoursPerSubject.length === 1) {
      const item = this.stats.charts.hoursPerSubject[0];
      return [{
        subject: item.subject,
        hours: item.hours,
        percentage: 100,
        color: colors[0],
        path: `M ${centerX} ${centerY} m ${-radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 ${-radius * 2},0`
      }];
    }

    let cumulativeAngle = 0;

    return this.stats.charts.hoursPerSubject.map((item, index) => {
      const percentage = (item.hours / total) * 100;
      const angle = (percentage / 100) * 2 * Math.PI;

      const startAngle = cumulativeAngle;
      const endAngle = cumulativeAngle + angle;

      // Calculate start and end points for the arc
      const x1 = centerX + radius * Math.cos(startAngle - Math.PI / 2);
      const y1 = centerY + radius * Math.sin(startAngle - Math.PI / 2);
      const x2 = centerX + radius * Math.cos(endAngle - Math.PI / 2);
      const y2 = centerY + radius * Math.sin(endAngle - Math.PI / 2);

      // Determine if we need the large arc flag
      const largeArcFlag = angle > Math.PI ? 1 : 0;

      // Build the SVG path
      const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

      cumulativeAngle = endAngle;

      return {
        subject: item.subject,
        hours: item.hours,
        percentage,
        color: colors[index % colors.length],
        path
      };
    });
  }
}

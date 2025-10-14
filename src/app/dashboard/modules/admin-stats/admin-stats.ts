import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { AdminStatsService } from '../../../services/admin-stats-service';
import { SnackBarService } from '../../../services/snackbar-service';

interface PlatformStats {
  userStatistics: {
    totalUsers: number;
    usersByType: {
      tutors: number;
      students: number;
      admins: number;
    };
    newUsersOverTime: Array<{ month: string; count: number }>;
    pendingApprovals: number;
    tutorStatus: {
      active: number;
      onLeave: number;
      inactive: number;
    };
  };
  platformActivity: {
    totalTutoringHours: number;
    mostPopularSubjects: Array<{ subject: string; count: number }>;
    activeBundles: number;
    overallTutorRating: number;
  };
  financialOverview: {
    totalPayouts: number;
  };
  tutorLeaderboard: Array<{
    tutorId: string;
    tutorName: string;
    totalHours: number;
    averageRating: number;
    missionsCompleted: number;
  }>;
}

@Component({
  selector: 'app-admin-stats',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatIconModule
  ],
  templateUrl: './admin-stats.html',
  styleUrl: './admin-stats.scss'
})
export class AdminStatsComponent implements OnInit {
  private adminStatsService = inject(AdminStatsService);
  private snackbarService = inject(SnackBarService);

  public stats: PlatformStats | null = null;
  public isLoading = true;
  public leaderboardColumns = ['rank', 'tutorName', 'totalHours', 'averageRating', 'missionsCompleted'];

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.isLoading = true;
    this.adminStatsService.getPlatformStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.isLoading = false;
      },
      error: (error) => {
        this.snackbarService.showError('Failed to load platform statistics');
        console.error('Error loading platform stats:', error);
        this.isLoading = false;
      }
    });
  }

  getTutorStatusSegments(): Array<{ label: string; count: number; percentage: number; color: string; path: string }> {
    if (!this.stats?.userStatistics.tutorStatus) return [];

    const { active, onLeave, inactive } = this.stats.userStatistics.tutorStatus;
    const total = active + onLeave + inactive;
    if (total === 0) return [];

    const colors = ['#34A853', '#FBBC04', '#EA4335']; // Green, Yellow, Red
    const data = [
      { label: 'Active', count: active },
      { label: 'On Leave', count: onLeave },
      { label: 'Inactive', count: inactive }
    ];

    const centerX = 100;
    const centerY = 100;
    const radius = 90;

    // Special case: if there's only one category with all tutors
    const nonZeroCount = data.filter(d => d.count > 0).length;
    if (nonZeroCount === 1) {
      const item = data.find(d => d.count > 0)!;
      const index = data.indexOf(item);
      return [{
        label: item.label,
        count: item.count,
        percentage: 100,
        color: colors[index],
        path: `M ${centerX} ${centerY} m ${-radius}, 0 a ${radius},${radius} 0 1,0 ${radius * 2},0 a ${radius},${radius} 0 1,0 ${-radius * 2},0`
      }];
    }

    let cumulativeAngle = 0;

    return data
      .filter(item => item.count > 0)
      .map((item, index) => {
        const percentage = (item.count / total) * 100;
        const angle = (percentage / 100) * 2 * Math.PI;

        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + angle;

        const x1 = centerX + radius * Math.cos(startAngle - Math.PI / 2);
        const y1 = centerY + radius * Math.sin(startAngle - Math.PI / 2);
        const x2 = centerX + radius * Math.cos(endAngle - Math.PI / 2);
        const y2 = centerY + radius * Math.sin(endAngle - Math.PI / 2);

        const largeArcFlag = angle > Math.PI ? 1 : 0;
        const path = `M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

        cumulativeAngle = endAngle;

        const originalIndex = data.indexOf(item);

        return {
          label: item.label,
          count: item.count,
          percentage,
          color: colors[originalIndex],
          path
        };
      });
  }

  getMaxSubjectCount(): number {
    if (!this.stats?.platformActivity.mostPopularSubjects.length) return 1;
    const max = Math.max(...this.stats.platformActivity.mostPopularSubjects.map(s => s.count));
    return max || 1;
  }

  getOverallRatingDisplay(): string {
    if (!this.stats) return 'N/A';
    return this.stats.platformActivity.overallTutorRating === 0
      ? 'N/A'
      : `${this.stats.platformActivity.overallTutorRating.toFixed(1)}/5`;
  }

  getMaxNewUsers(): number {
    if (!this.stats?.userStatistics.newUsersOverTime.length) return 1;
    const max = Math.max(...this.stats.userStatistics.newUsersOverTime.map(u => u.count));
    return max || 1;
  }
}

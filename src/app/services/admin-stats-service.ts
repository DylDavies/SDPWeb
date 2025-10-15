import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';

export interface PlatformStats {
  userStatistics: {
    totalUsers: number;
    usersByType: {
      tutors: number;
      students: number;
      admins: number;
    };
    newUsersOverTime: { month: string; count: number }[];
    pendingApprovals: number;
    tutorStatus: {
      active: number;
      onLeave: number;
      inactive: number;
    };
  };
  platformActivity: {
    totalTutoringHours: number;
    mostPopularSubjects: { subject: string; count: number }[];
    activeBundles: number;
    overallTutorRating: number;
  };
  financialOverview: {
    totalPayouts: number;
  };
  tutorLeaderboard: {
    tutorId: string;
    tutorName: string;
    totalHours: number;
    averageRating: number;
    missionsCompleted: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class AdminStatsService {
  private httpService = inject(HttpService);

  getPlatformStats(): Observable<PlatformStats> {
    return this.httpService.get<PlatformStats>('admin/stats/platform');
  }
}

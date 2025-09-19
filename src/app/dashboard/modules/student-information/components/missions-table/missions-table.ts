import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MissionService } from '../../../../../services/missions-service';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { ActivatedRoute } from '@angular/router';
import { NotificationService } from '../../../../../services/notification-service';

@Component({
  selector: 'app-missions-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatButtonModule, MatIconModule, MatTooltipModule],
  templateUrl: './missions-table.html',
  styleUrls: ['./missions-table.scss']
})
export class MissionsTable implements OnInit {
  private missionService = inject(MissionService);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  public missions: IMissions[] = [];
  public displayedColumns: string[] = ['documentName', 'tutor', 'remuneration', 'dateCompleted', 'status', 'actions'];

  ngOnInit(): void {
    this.loadMissions();
  }

  loadMissions(): void {
    const studentId = this.route.snapshot.paramMap.get('id');
    if (studentId) {
      this.missionService.getMissions().subscribe(missions => {
        this.missions = missions.filter(m => (m.student as any)?._id === studentId);
      });
    }
  }

  downloadDocument(mission: IMissions): void {
    const filename = mission.documentPath.split('/').pop() || mission.documentName;
    this.missionService.downloadMissionDocument(filename).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = mission.documentName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, error => {
      this.notificationService.showError('Error downloading file.');
      console.error(error);
    });
  }
}
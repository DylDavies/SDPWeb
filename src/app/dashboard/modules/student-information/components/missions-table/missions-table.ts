import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { IMissions} from '../../../../../models/interfaces/IMissions.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { AuthService } from '../../../../../services/auth-service';
import { MissionService } from '../../../../../services/missions-service';
import { NotificationService } from '../../../../../services/notification-service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { filter } from 'rxjs/operators';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';
import { ViewMissionModal } from '../view-mission-modal/view-mission-modal';
import { MissionsModal } from '../missions-modal/missions-modal';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-missions-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, MatDialogModule, DatePipe,
    MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule
  ],
  templateUrl: './missions-table.html',
  styleUrls: ['./missions-table.scss']
})
export class MissionsTable implements OnInit, OnDestroy, OnChanges {
  @Input() bundleId: string | null = null;
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private missionService = inject(MissionService);

  public dataSource = new MatTableDataSource<IMissions>();
  public displayedColumns: string[] = ['documentName', 'tutor', 'createdAt', 'remuneration', 'hoursCompleted', 'dateCompleted'];
  public canEditMissions = false;
  public canDeleteMissions = false;
  public isLoading = true;

  private subscriptions = new Subscription();

  constructor() {
    this.dataSource.filterPredicate = this.createFilter();
  }

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  ngOnInit(): void {
    this.canEditMissions = this.authService.hasPermission(EPermission.MISSIONS_EDIT);
    this.canDeleteMissions = this.authService.hasPermission(EPermission.MISSIONS_DELETE);

    if (this.canEditMissions || this.canDeleteMissions) {
      this.displayedColumns.push('actions');
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
      if (changes['bundleId'] && changes['bundleId'].currentValue) {
          this.loadMissions();
      }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
  
  loadMissions(): void {
    if (!this.bundleId) return;
    
    this.isLoading = true;
    this.subscriptions.add(
     
      this.missionService.getMissionsByBundleId(this.bundleId).subscribe(missions => {
        this.dataSource.data = missions;
        this.dataSource.paginator = this.paginator;
        this.dataSource.sort = this.sort;
        this.isLoading = false;
      })
    );
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  createFilter(): (data: IMissions, filter: string) => boolean {
      const filterFunction = (data: IMissions, filter: string): boolean => {
        const searchTerms = JSON.stringify(data.tutor).toLowerCase();
        return searchTerms.indexOf(filter) !== -1;
      };
      return filterFunction;
    }

  viewDocument(mission: IMissions): void {
    this.dialog.open(ViewMissionModal, {
      width: '80vw',
      height: '90vh',
      data: mission
    });
  }

  editMission(mission: IMissions): void {
    const dialogRef = this.dialog.open(MissionsModal, {
      width: 'clamp(500px, 80vw, 700px)',
      data: { mission, student: mission.student, bundleId: this.bundleId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadMissions();
      }
    });
  }

  deactivateMission(mission: IMissions): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Deactivate Mission',
        message: `Are you sure you want to deactivate the mission "${mission.documentName}"? This will mark it as inactive but will not permanently delete it.`,
        confirmText: 'Deactivate',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.missionService.setMissionStatus(mission._id, EMissionStatus.InActive).subscribe({
        next: () => {
          this.notificationService.showSuccess('Mission deactivated successfully.');
          this.loadMissions();
        },
        error: (err) => this.notificationService.showError(err.error?.message || 'Failed to deactivate mission.')
      });
    });
  }
  
  getTutorName(mission: IMissions): string {
      const tutor = mission.tutor as IPopulatedUser;
      return tutor?.displayName || 'N/A';
  }
}
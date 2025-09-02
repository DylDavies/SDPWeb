import { Component, OnInit, ViewChild, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule, Sort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Subscription } from 'rxjs';
import { IStudyGroup } from '../../../../../models/interfaces/IStudyGroup.interface';
import { StudyGroupService } from '../../../../../services/study-group-service';
import { NotificationService } from '../../../../../services/notification-service';
import { LiveAnnouncer } from '@angular/cdk/a11y';

@Component({
  selector: 'app-upcoming-studygroups-table',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule
  ],
  templateUrl: './upcoming-study-groups-table.html',
  styleUrls: ['./upcoming-study-groups-table.scss']
})
export class UpcomingStudyGroupsTable implements OnInit, OnDestroy {
  private studyGroupService = inject(StudyGroupService);
  private notificationService = inject(NotificationService);
  private liveAnnouncer = inject(LiveAnnouncer);
  private subscriptions = new Subscription();

  public dataSource = new MatTableDataSource<IStudyGroup>();
  public displayedColumns: string[] = ['name', 'faculty', 'course', 'scheduled_start', 'status'];
  public isLoading = true;

  // Use setters for ViewChild to ensure paginator and sort are set when they are rendered
  @ViewChild(MatPaginator) set paginator(paginator: MatPaginator) {
    if (paginator) {
      this.dataSource.paginator = paginator;
    }
  }
  @ViewChild(MatSort) set sort(sort: MatSort) {
    if (sort) {
      this.dataSource.sort = sort;
      this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
            case 'scheduled_start': return new Date(item.scheduled_start).getTime();
            default: return 0;
        }
      };
    }
  }

  ngOnInit(): void {
    this.fetchUpcomingStudyGroups();
  }
  
  private fetchUpcomingStudyGroups(): void {
    this.isLoading = true;
    this.subscriptions.add(
      this.studyGroupService.getUpcomingStudyGroups().subscribe({
        next: (studygroups) => {
          this.dataSource.data = studygroups;
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to fetch upcoming study groups', err);
          this.notificationService.showError('Could not load upcoming study groups. Please try again later.');
          this.isLoading = false;
        }
      })
    );
  }

  /** Announce the change in sort state for assistive technology. */
  announceSortChange(sortState: Sort): void {
    if (sortState.direction) {
      this.liveAnnouncer.announce(`Sorted ${sortState.direction}ending`);
    } else {
      this.liveAnnouncer.announce('Sorting cleared');
    }
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}


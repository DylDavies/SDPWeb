import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild, inject, AfterViewInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { EventService } from '../../../../../services/event-service';
import { MatDialog } from '@angular/material/dialog';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { RemarkModal } from '../../../client-dashboard/components/remark-modal/remark-modal';
import { MatCardModule } from "@angular/material/card";

@Component({
  selector: 'app-lessons-table',
  standalone: true,
  imports: [
    CommonModule, MatTableModule, MatButtonModule, MatIconModule,
    MatProgressSpinnerModule, MatTooltipModule, DatePipe,
    MatPaginatorModule, MatSortModule, MatFormFieldModule, MatInputModule,
    MatCardModule
],
  templateUrl: './lessons-table.html',
  styleUrls: ['./lessons-table.scss']
})
export class LessonsTable implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() bundleId: string | null = null;
  private eventService = inject(EventService);
  private dialog = inject(MatDialog);

  public dataSource = new MatTableDataSource<IEvent>();
  public displayedColumns: string[] = ['startTime', 'subject', 'tutor', 'duration', 'rating', 'status'];
  public isLoading = true;

  private subscriptions = new Subscription();

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    this.dataSource.sortingDataAccessor = (data: IEvent, sortHeaderId: string) => {
      const tutor = data.tutor as IPopulatedUser;
      const value = data[sortHeaderId as keyof IEvent];
      switch (sortHeaderId) {
        case 'tutor':
          return tutor?.displayName?.toLowerCase() || '';
        case 'startTime':
          return new Date(data.startTime).getTime();
        case 'subject':
          return data.subject.toLowerCase();
        case 'duration':
          return data.duration;
        default:
          return typeof value === 'string' ? value : String(value || '');
      }
    };

    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.dataSource.sort = this.sort;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['bundleId'] && changes['bundleId'].currentValue) {
      this.loadLessons();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadLessons(): void {
    if (!this.bundleId) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.eventService.getEventsByBundle(this.bundleId).subscribe(events => {
        this.dataSource.data = events;

        setTimeout(() => {
          this.dataSource.sort = this.sort;
        });

        this.isLoading = false;
      })
    );
  }

  applyFilter(event: Event): void {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();
  }

  createFilter(): (data: IEvent, filter: string) => boolean {
    return (data: IEvent, filter: string): boolean => {
      const tutor = data.tutor as IPopulatedUser;
      const tutorName = tutor?.displayName?.toLowerCase() || '';
      const subject = data.subject.toLowerCase();
      return tutorName.includes(filter) || subject.includes(filter);
    };
  }

  viewLesson(event: IEvent): void {
    const dialogRef = this.dialog.open(RemarkModal, {
      width: '600px',
      data: { event }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadLessons();
      }
    });
  }

  getTutorName(event: IEvent): string {
    const tutor = event.tutor as IPopulatedUser;
    return tutor?.displayName || 'N/A';
  }

  getEventTime(event: IEvent): string {
    const startTime = new Date(event.startTime);
    const endTime = new Date(startTime.getTime() + event.duration * 60000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }

  getStatusLabel(event: IEvent): string {
    if (event.remarked && event.rating) {
      return 'Complete';
    } else if (event.remarked) {
      return 'Remarked';
    } else if (event.rating) {
      return 'Rated';
    }
    return 'Pending';
  }
}

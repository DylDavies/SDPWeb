import { Component, inject, OnInit, AfterViewInit, ViewChild} from '@angular/core';
import { CommonModule, DatePipe, SlicePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenu, MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { NotificationService } from '../../../services/notification-service';
import { AuthService } from '../../../services/auth-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { ExtraWorkService } from '../../../services/extra-work';
import { IExtraWork, EExtraWorkStatus } from '../../../models/interfaces/IExtraWork.interface';
import { IPopulatedUser } from '../../../models/interfaces/IBundle.interface';
import { AddExtraWorkModal } from './components/add-extra-work-modal/add-extra-work-modal';

@Component({
  selector: 'app-extra-work-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    SlicePipe,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatProgressSpinnerModule,
    MatDialogModule,
    MatTooltipModule,
    MatMenuModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './extra-work-dashboard.html',
  styleUrl: './extra-work-dashboard.scss'
})
export class ExtraWorkDashboard implements OnInit, AfterViewInit {
  private extraWorkService = inject(ExtraWorkService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  public isLoading = true;
  public today = new Date();
  public EExtraWorkStatus = EExtraWorkStatus;

  displayedColumns: string[] = ['student', 'workType', 'details', 'remuneration', 'commissioner', 'dateCompleted', 'status', 'actions'];
  dataSource: MatTableDataSource<IExtraWork>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  public canCreate = this.authService.hasPermission(EPermission.EXTRA_WORK_CREATE);
  public canEdit = this.authService.hasPermission(EPermission.EXTRA_WORK_EDIT);
  public canApprove = this.authService.hasPermission(EPermission.EXTRA_WORK_APPROVE);

  constructor() {
    this.dataSource = new MatTableDataSource<IExtraWork>([]);
  }

  ngOnInit(): void {
    this.loadExtraWork();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
            case 'student':
                return (item.studentId as IPopulatedUser)?.displayName || '';
            case 'dateCompleted':
                return item.dateCompleted ? new Date(item.dateCompleted).getTime() : 0;
            case 'workType':
                return item.workType;
            case 'remuneration':
                return item.remuneration;
            case 'commissioner':
                return (item.commissionerId as IPopulatedUser)?.displayName || '';
            case 'status':
                return item.status;
            default: return 0;
        }
    };
  }

  loadExtraWork(): void {
    this.isLoading = true;
    this.extraWorkService.getMyExtraWork().subscribe({
      next: (workItems: IExtraWork[]) => {
        this.dataSource.data = workItems;
        this.isLoading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(err.error?.message || 'Failed to load extra work.');
        this.isLoading = false;
      }
    });
  }

  applyFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.dataSource.filter = filterValue.trim().toLowerCase();

    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }
  
  getStudentName(item: IExtraWork): string {
    const student = item.studentId as IPopulatedUser;
    return student?.displayName || 'N/A';
  }

  getCommissionerName(item: IExtraWork): string {
    const commissioner = item.commissionerId as IPopulatedUser;
    return commissioner?.displayName || 'N/A';
  }

  openAddWorkDialog(): void {
    const dialogRef = this.dialog.open(AddExtraWorkModal, {
      width: 'clamp(500px, 80vw, 600px)',
      autoFocus: false
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadExtraWork();
      }
    });
  }
  
  /**
   * Handles the date selection from the calendar menu.
   * @param selectedDate The date selected from the mat-calendar.
   * @param item The extra work item being updated.
   * @param menu The MatMenu instance to close it after selection.
   */
  onDateSelected(selectedDate: Date | null, item: IExtraWork, menu: MatMenu): void {
    menu.closed.emit(); // Close the menu
    if (!selectedDate) return;

    this.extraWorkService.completeExtraWork(item._id, selectedDate).subscribe({
      next: () => {
        this.notificationService.showSuccess('Work item marked as complete!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(err.error?.message || 'Failed to update item.');
      }
    });
  }
}
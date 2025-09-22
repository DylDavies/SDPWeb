import { Component, inject, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
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
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { SocketService } from '../../../services/socket-service';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';

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
    MatNativeDateModule,
    MatTabsModule
  ],
  templateUrl: './extra-work-dashboard.html',
  styleUrl: './extra-work-dashboard.scss'
})
export class ExtraWorkDashboard implements OnInit, AfterViewInit, OnDestroy {
  private extraWorkService = inject(ExtraWorkService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);

  public isLoading = true;
  public isCommissionedLoading = true;
  public today = new Date();
  public EExtraWorkStatus = EExtraWorkStatus;
  public currentUser: IUser | null = null;
  private subscriptions = new Subscription();


  myWorkDisplayedColumns: string[] = ['createdAt', 'student', 'workType', 'details', 'remuneration', 'commissioner', 'dateCompleted', 'status'];
  commissionedDisplayedColumns: string[] = ['createdAt', 'student', 'workType', 'details', 'remuneration', 'commissioner', 'dateCompleted', 'status', 'actions'];

  dataSource: MatTableDataSource<IExtraWork>;
  commissionedDataSource: MatTableDataSource<IExtraWork>;

  @ViewChild('myWorkPaginator') paginator!: MatPaginator;
  @ViewChild('myWorkSort') sort!: MatSort;
  @ViewChild('commissionedPaginator') commissionedPaginator!: MatPaginator;
  @ViewChild('commissionedSort') commissionedSort!: MatSort;

  public canCreate = this.authService.hasPermission(EPermission.EXTRA_WORK_CREATE);
  public canEdit = this.authService.hasPermission(EPermission.EXTRA_WORK_EDIT);
  public canApprove = this.authService.hasPermission(EPermission.EXTRA_WORK_APPROVE);
  public canViewAll = this.authService.hasPermission(EPermission.EXTRA_WORK_VIEW_ALL);

  constructor() {
    this.dataSource = new MatTableDataSource<IExtraWork>([]);
    this.commissionedDataSource = new MatTableDataSource<IExtraWork>([]);
  }

  ngOnInit(): void {
    this.subscriptions.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.loadExtraWork();
      })
    );

    this.socketService.subscribe(ESocketMessage.ExtraWorkUpdated);
    this.subscriptions.add(
      this.socketService.listen(ESocketMessage.ExtraWorkUpdated).subscribe(() => {
        console.log('Received extra-work-updated event. Refreshing lists.');
        this.loadExtraWork();
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.socketService.unsubscribe(ESocketMessage.ExtraWorkUpdated);
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
            case 'createdAt': return new Date(item.createdAt).getTime();
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

    if (this.canApprove) {
      this.commissionedDataSource.paginator = this.commissionedPaginator;
      this.commissionedDataSource.sort = this.commissionedSort;
      this.commissionedDataSource.sortingDataAccessor = (item, property) => {
          switch (property) {
              case 'createdAt': return new Date(item.createdAt).getTime();
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
  }

  loadExtraWork(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.isCommissionedLoading = true;

    this.extraWorkService.allExtraWork$.subscribe({
        next: (workItems: IExtraWork[]) => {
            const userId = this.currentUser?._id;

            console.log(workItems);

            if (this.canViewAll) {
              this.dataSource.data = workItems;

              this.isLoading = false;

              if (this.canApprove) {
                this.commissionedDataSource.data = workItems;

                this.isCommissionedLoading = false;
              }
            } else {
              this.dataSource.data = workItems.filter(v => v.commissionerId !== userId);
              this.isLoading = false;

              if (this.canApprove) {
                  this.commissionedDataSource.data = workItems.filter(v => v.userId !== userId);

                  this.isCommissionedLoading = false;
              }
            }
        },
        error: (err: HttpErrorResponse) => {
            this.notificationService.showError(err.error?.message || 'Failed to load extra work.');
            this.isLoading = false;
            this.isCommissionedLoading = false;
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

  applyCommissionedFilter(event: Event) {
    const filterValue = (event.target as HTMLInputElement).value;
    this.commissionedDataSource.filter = filterValue.trim().toLowerCase();

    if (this.commissionedDataSource.paginator) {
      this.commissionedDataSource.paginator.firstPage();
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

  approveWork(item: IExtraWork): void {
    this.extraWorkService.setExtraWorkStatus(item._id, EExtraWorkStatus.Approved).subscribe({
      next: () => {
        this.notificationService.showSuccess('Work item approved!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(err.error?.message || 'Failed to approve item.');
      }
    });
  }

  denyWork(item: IExtraWork): void {
    this.extraWorkService.setExtraWorkStatus(item._id, EExtraWorkStatus.Denied).subscribe({
      next: () => {
        this.notificationService.showSuccess('Work item denied!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.notificationService.showError(err.error?.message || 'Failed to deny item.');
      }
    });
  }
}
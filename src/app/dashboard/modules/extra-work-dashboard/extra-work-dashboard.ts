import { Component, inject, OnInit, AfterViewInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
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
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { AuthService } from '../../../services/auth-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { ExtraWorkService } from '../../../services/extra-work';
import { IExtraWork, EExtraWorkStatus } from '../../../models/interfaces/IExtraWork.interface';
import { IPopulatedUser } from '../../../models/interfaces/IBundle.interface';
import { AddExtraWorkModal } from './components/add-extra-work-modal/add-extra-work-modal';
import { ViewExtraWorkModal } from './components/view-extra-work-modal/view-extra-work-modal';
import { MatTabsModule } from '@angular/material/tabs';
import { Subscription } from 'rxjs';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { SocketService } from '../../../services/socket-service';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';
import { SnackBarService } from '../../../services/snackbar-service';

@Component({
  selector: 'app-extra-work-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
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
  private snackbarService = inject(SnackBarService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);

  public isLoading = true;
  public isCommissionedLoading = true;
  public EExtraWorkStatus = EExtraWorkStatus;
  public currentUser: IUser | null = null;
  private subscriptions = new Subscription();

  myWorkDisplayedColumns: string[] = ['createdAt', 'student', 'workType', 'remuneration', 'commissioner', 'status'];
  commissionedDisplayedColumns: string[] = ['createdAt', 'student', 'workType', 'remuneration', 'createdBy', 'status', 'actions'];

  dataSource: MatTableDataSource<IExtraWork>;
  commissionedDataSource: MatTableDataSource<IExtraWork>;

  @ViewChild('myWorkPaginator') set myWorkPaginator(paginator: MatPaginator) {
    if (paginator) { this.dataSource.paginator = paginator; }
  }
  @ViewChild('myWorkSort') set myWorkSort(sort: MatSort) {
    if (sort) { this.dataSource.sort = sort; }
  }
  @ViewChild('commissionedPaginator') set commissionedPaginator(paginator: MatPaginator) {
    if (paginator) { this.commissionedDataSource.paginator = paginator; }
  }
  @ViewChild('commissionedSort') set commissionedSort(sort: MatSort) {
    if (sort) { this.commissionedDataSource.sort = sort; }
  }

  public canCreate = this.authService.hasPermission(EPermission.EXTRA_WORK_CREATE);
  public canEdit = this.authService.hasPermission(EPermission.EXTRA_WORK_EDIT);
  public canApprove = this.authService.hasPermission(EPermission.EXTRA_WORK_APPROVE);
  public canViewAll = this.authService.hasPermission(EPermission.EXTRA_WORK_VIEW_ALL);

  constructor() {
    this.dataSource = new MatTableDataSource<IExtraWork>([]);
    this.commissionedDataSource = new MatTableDataSource<IExtraWork>([]);
    this.dataSource.filterPredicate = this.createFilterPredicate();
    this.commissionedDataSource.filterPredicate = this.createFilterPredicate();
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
    this.dataSource.sortingDataAccessor = (item, property) => {
        switch (property) {
            case 'createdAt': return new Date(item.createdAt).getTime();
            case 'student': return (item.studentId as IPopulatedUser)?.displayName || '';
            case 'workType': return item.workType;
            case 'remuneration': return item.remuneration;
            case 'createdBy': return (item.userId as IPopulatedUser)?.displayName || '';
            case 'status': return item.status;
            default: return 0;
        }
    };
    if (this.canApprove) {
      this.commissionedDataSource.sortingDataAccessor = this.dataSource.sortingDataAccessor;
    }
  }

  loadExtraWork(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.isCommissionedLoading = true;

    this.extraWorkService.allExtraWork$.subscribe({
        next: (workItems: IExtraWork[]) => {
            const userId = this.currentUser?._id;

            if (this.canViewAll) {
              this.dataSource.data = workItems;
              this.isLoading = false;
              if (this.canApprove) {
                this.commissionedDataSource.data = workItems;
                this.isCommissionedLoading = false;
              }
            } else {
              // "My extra work" - show work where I am the creator (userId)
              this.dataSource.data = workItems.filter(v => {
                const creatorId = typeof v.userId === 'string' ? v.userId : (v.userId as IPopulatedUser)?._id;
                return creatorId === userId;
              });
              this.isLoading = false;
              if (this.canApprove) {
                  // "Commissioned work" - show work where I am the commissioner
                  this.commissionedDataSource.data = workItems.filter(v => {
                    const commissionerId = typeof v.commissionerId === 'string' ? v.commissionerId : (v.commissionerId as IPopulatedUser)?._id;
                    return commissionerId === userId;
                  });
                  this.isCommissionedLoading = false;
              }
            }
        },
        error: (err: HttpErrorResponse) => {
            this.snackbarService.showError(err.error?.message || 'Failed to load extra work.');
            this.isLoading = false;
            this.isCommissionedLoading = false;
        }
    });
  }

  createFilterPredicate(): (data: IExtraWork, filter: string) => boolean {
    return (data: IExtraWork, filter: string): boolean => {
      const dataStr = (
        this.getStudentName(data) +
        this.getCreatedByName(data) +
        data.workType +
        data.status +
        data.remuneration
      ).toLowerCase();
      return dataStr.includes(filter);
    };
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

  getCommisionedByName(item: IExtraWork): string {
    const commisioned = item.commissionerId as IPopulatedUser;
    return commisioned?.displayName || 'N/A';
  }

  getCreatedByName(item: IExtraWork): string {
    const createdBy = item.userId as IPopulatedUser;
    return createdBy?.displayName || 'N/A';
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

  openViewWorkDialog(item: IExtraWork): void {
    const dialogRef = this.dialog.open(ViewExtraWorkModal, {
      width: 'clamp(500px, 80vw, 650px)',
      autoFocus: false,
      data: { item: item, canEdit: this.canEdit }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result instanceof Date) {
        this.onDateSelected(result, item);
      }
    });
  }

  onDateSelected(selectedDate: Date, item: IExtraWork): void {
    this.extraWorkService.completeExtraWork(item._id, selectedDate).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Work item marked as complete!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.snackbarService.showError(err.error?.message || 'Failed to update item.');
      }
    });
  }

  approveWork(item: IExtraWork): void {
    this.extraWorkService.setExtraWorkStatus(item._id, EExtraWorkStatus.Approved).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Work item approved!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.snackbarService.showError(err.error?.message || 'Failed to approve item.');
      }
    });
  }

  denyWork(item: IExtraWork): void {
    this.extraWorkService.setExtraWorkStatus(item._id, EExtraWorkStatus.Denied).subscribe({
      next: () => {
        this.snackbarService.showSuccess('Work item denied!');
        this.loadExtraWork();
      },
      error: (err: HttpErrorResponse) => {
        this.snackbarService.showError(err.error?.message || 'Failed to deny item.');
      }
    });
  }
}
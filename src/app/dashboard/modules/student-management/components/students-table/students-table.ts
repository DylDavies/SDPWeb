import { Component, inject, OnInit, OnDestroy, AfterViewInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subscription } from 'rxjs';

import { BundleService } from '../../../../../services/bundle-service';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { IBundle, IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../../../../services/auth-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-students-table',
  standalone: true,
  imports: [
    CommonModule,
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
    MatTooltipModule
  ],
  templateUrl: './students-table.html',
  styleUrls: ['./students-table.scss']
})
export class StudentsTable implements OnInit, OnDestroy, AfterViewInit {
  private bundleService = inject(BundleService);
  private snackbarService = inject(SnackBarService);
  private router = inject(Router);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  public isLoading = true;
  public EBundleStatus = EBundleStatus;
  private currentUser: IUser | null = null;
  private subscription = new Subscription();

  displayedColumns: string[] = ['student', 'createdBy', 'totalHours'];
  dataSource = new MatTableDataSource<IBundle>([]);

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
    
    this.dataSource.sortingDataAccessor = (data: IBundle, sortHeaderId: string) => {
      switch (sortHeaderId) {
        case 'student':
          if (typeof data.student === 'object' && data.student) {
            return data.student.displayName?.toLowerCase() || '';
          }
          return '';
        case 'createdBy':
            return this.getCreatorName(data).toLowerCase();
        case 'totalHours':
            return this.getTotalHours(data);
        default:
          return (data as unknown as Record<string, unknown>)[sortHeaderId] as string;
      }
    };

   
    this.dataSource.filterPredicate = (data: IBundle, filter: string): boolean => {
      const studentName =
        typeof data.student === 'object' && data.student?.displayName
          ? data.student.displayName.toLowerCase()
          : '';
      const creatorName = this.getCreatorName(data).toLowerCase();
      const totalHours = this.getTotalHours(data).toString();

      return studentName.includes(filter) || 
             creatorName.includes(filter) ||
             totalHours.includes(filter);
    };
  }

  ngOnInit(): void {
    this.subscription.add(
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.loadBundles();
        this.cdr.detectChanges();
      })
    );
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }

  loadBundles(): void {
    if (!this.currentUser) {
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.subscription.add(
      this.bundleService.getBundles().subscribe({
        next: bundles => {
          let filteredBundles = bundles.filter(b => b.isActive);

          if (this.currentUser?.type === EUserType.Staff) {
            filteredBundles = filteredBundles.filter(bundle =>
              bundle.subjects.some(subject => {
                const tutorId = typeof subject.tutor === 'object' ? subject.tutor._id : subject.tutor;
                return tutorId === this.currentUser?._id;
              })
            );
          }

          this.dataSource.data = filteredBundles;

          setTimeout(() => {
            this.dataSource.paginator = this.paginator;
            this.dataSource.sort = this.sort;
          });

          this.isLoading = false;
          this.cdr.detectChanges();
        },
        error: err => {
          this.snackbarService.showError(err.error?.message || 'Failed to load bundles.');
          this.isLoading = false;
          this.cdr.detectChanges();
        }
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

  viewStudentInfo(student: IBundle): void {
    this.router.navigate(['/dashboard/student-info', student._id]);
  }

  
  getTotalHours(bundle: IBundle): number {
    if (!bundle || !bundle.subjects) {
        return 0;
    }
    const totalMinutes = bundle.subjects.reduce((sum, subject) => sum + subject.durationMinutes, 0);
    return totalMinutes / 60;
  }

  
  getCreatorName(bundle: IBundle): string {
      if (typeof bundle.createdBy === 'object' && bundle.createdBy) {
          return (bundle.createdBy as IPopulatedUser).displayName || 'N/A';
      }
      return 'N/A';
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
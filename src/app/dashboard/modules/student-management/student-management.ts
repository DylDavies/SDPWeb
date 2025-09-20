import { Component, inject, OnInit, AfterViewInit, ViewChild } from '@angular/core';
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
import { BundleService } from '../../../services/bundle-service';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { IBundle} from '../../../models/interfaces/IBundle.interface';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth-service'; // Import AuthService
import { IUser } from '../../../models/interfaces/IUser.interface'; // Import IUser
import { EUserType } from '../../../models/enums/user-type.enum'; // Import EUserType
import { SnackBarService } from '../../../services/snackbar-service';


@Component({
  selector: 'app-student-management',
  imports: [CommonModule,
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
    MatTooltipModule],
  templateUrl: './student-management.html',
  styleUrl: './student-management.scss'
})
export class StudentManagement implements OnInit, AfterViewInit {
    private bundleService = inject(BundleService);
    private snackbarService = inject(SnackBarService);
    private router = inject(Router);
    private authService = inject(AuthService); // Inject AuthService
    public isLoading = true;
    public EBundleStatus = EBundleStatus; 
    private currentUser: IUser | null = null;


    // Table properties
    displayedColumns: string[] = ['student'];
    dataSource: MatTableDataSource<IBundle>;
    
    @ViewChild(MatPaginator) paginator!: MatPaginator;
    @ViewChild(MatSort) sort!: MatSort;

    constructor() {
    this.dataSource = new MatTableDataSource<IBundle>([]);
    this.dataSource.filterPredicate = this.createFilter();
  }
  ngOnInit(): void {
      this.authService.currentUser$.subscribe(user => {
        this.currentUser = user;
        this.loadBundles();
      });
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
    this.bundleService.getBundles().subscribe({
      next: (bundles) => {
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
        this.isLoading = false;
      },
      error: (err) => {
        this.snackbarService.showError(err.error?.message || 'Failed to load bundles.');
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
  
  createFilter(): (data: IBundle, filter: string) => boolean {
    const filterFunction = (data: IBundle, filter: string): boolean => {
      // Ensure student is populated before accessing displayName
      const studentName = (typeof data.student === 'object' && data.student.displayName) 
        ? data.student.displayName.toLowerCase() 
        : '';
      return studentName.includes(filter);
    };
    return filterFunction;
  }
  viewStudentInfo(student: IBundle): void {
      this.router.navigate(['/dashboard/student-info', student._id]);
    }

}

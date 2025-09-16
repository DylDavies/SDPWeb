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
import { NotificationService } from '../../../services/notification-service';
import { BundleService } from '../../../services/bundle-service';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { IBundle } from '../../../models/interfaces/IBundle.interface';


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
    private notificationService = inject(NotificationService);

    public isLoading = true;
    public EBundleStatus = EBundleStatus; 


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
      this.loadBundles();
  }
  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
  }
  loadBundles(): void {
    this.isLoading = true;
    this.bundleService.getBundles().subscribe({
      next: (bundles) => {
        this.dataSource.data = bundles.filter(b => b.isActive);
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Failed to load bundles.');
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
      const searchTerms = JSON.stringify(data.student).toLowerCase();
      return searchTerms.indexOf(filter) !== -1;
    };
    return filterFunction;
  }

}

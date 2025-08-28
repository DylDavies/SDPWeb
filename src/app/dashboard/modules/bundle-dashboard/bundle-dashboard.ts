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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NotificationService } from '../../../services/notification-service';
import { BundleService } from '../../../services/bundle-service';
import { IBundle } from '../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { EditBundleModal } from './components/edit-bundle-modal/edit-bundle-modal';
import { CreateBundleModal } from './components/create-bundle-modal/create-bundle-modal';

@Component({
  selector: 'app-bundle-dashboard',
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
  templateUrl: './bundle-dashboard.html',
  styleUrls: ['./bundle-dashboard.scss']
})
export class BundleDashboard implements OnInit, AfterViewInit {
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  public isLoading = true;
  public EBundleStatus = EBundleStatus;

  // Table properties
  displayedColumns: string[] = ['student', 'status', 'isActive', 'createdAt', 'actions'];
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
        this.dataSource.data = bundles;
        this.isLoading = false;
      },
      error: (err) => {
        this.notificationService.showError(err.error?.message || 'Failed to load bundles.');
        this.isLoading = false;
      }
    });
  }
  
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateBundleModal, {
      width: 'clamp(400px, 90vw, 600px)',
    });

    dialogRef.afterClosed().subscribe(result => {
      // If the dialog returned a result, it means a new bundle was created.
      if (result) {
        this.loadBundles(); // Refresh the table.
      }
    });
  }

  openEditDialog(bundle: IBundle): void {
    const dialogRef = this.dialog.open(EditBundleModal, {
      width: 'clamp(400px, 90vw, 600px)',
      data: JSON.parse(JSON.stringify(bundle))
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBundles();
      }
    });
  }

  confirmAndDeactivate(bundle: IBundle): void {
    const studentName = typeof bundle.student === 'object' ? bundle.student.displayName : 'the student';
    if (confirm(`Are you sure you want to deactivate the bundle for ${studentName}? It will be hidden but not permanently deleted.`)) {
      this.bundleService.setBundleActiveStatus(bundle._id, false).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle deactivated successfully.');
          this.loadBundles();
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to deactivate bundle.');
        }
      });
    }
  }

  approveBundle(bundle: IBundle): void {
    if (confirm('Are you sure you want to approve this bundle?')) {
      this.bundleService.setBundleStatus(bundle._id, EBundleStatus.Approved).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle approved.');
          this.loadBundles();
        },
        error: (err) => this.notificationService.showError(err.error?.message || 'Failed to approve bundle.')
      });
    }
  }

  denyBundle(bundle: IBundle): void {
    if (confirm('Are you sure you want to deny this bundle?')) {
      this.bundleService.setBundleStatus(bundle._id, EBundleStatus.Denied).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle denied.');
          this.loadBundles();
        },
        error: (err) => this.notificationService.showError(err.error?.message || 'Failed to deny bundle.')
      });
    }
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
      const searchTerms = JSON.stringify(data).toLowerCase();
      return searchTerms.indexOf(filter) !== -1;
    };
    return filterFunction;
  }
}
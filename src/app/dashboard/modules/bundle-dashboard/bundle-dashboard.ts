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
import { filter } from 'rxjs/operators';
import { NotificationService } from '../../../services/notification-service';
import { BundleService } from '../../../services/bundle-service';
import { IBundle } from '../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { CreateEditBundleModal } from './components/create-edit-bundle-modal/create-edit-bundle-modal';
import { AuthService } from '../../../services/auth-service';
import { EPermission } from '../../../models/enums/permission.enum';
import { ConfirmationDialog } from '../../../shared/components/confirmation-dialog/confirmation-dialog';

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
  private authService = inject(AuthService);

  public isLoading = true;
  public EBundleStatus = EBundleStatus;

  // Table properties
  displayedColumns: string[] = ['student', 'status', 'createdAt', 'actions'];
  dataSource: MatTableDataSource<IBundle>;

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Permission checks
  public canCreateBundles = false;
  public canEditBundles = false;
  public canDeleteBundles = false;
  public canApproveBundles = false;

  constructor() {
    this.dataSource = new MatTableDataSource<IBundle>([]);
    this.dataSource.filterPredicate = this.createFilter();
  }

  ngOnInit(): void {
    this.loadBundles();
    this.canCreateBundles = this.authService.hasPermission(EPermission.BUNDLES_CREATE);
    this.canEditBundles = this.authService.hasPermission(EPermission.BUNDLES_EDIT);
    this.canDeleteBundles = this.authService.hasPermission(EPermission.BUNDLES_DELETE);
    this.canApproveBundles = this.authService.hasPermission(EPermission.BUNDLES_APPROVE);
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
  
  openCreateDialog(): void {
    const dialogRef = this.dialog.open(CreateEditBundleModal, { // Use the new modal
      panelClass: 'bundle-dialog-container'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBundles();
      }
    });
  }

  openEditDialog(bundle: IBundle): void {
    const dialogRef = this.dialog.open(CreateEditBundleModal, { // Use the new modal
      panelClass: 'bundle-dialog-container',
      data: { bundle: JSON.parse(JSON.stringify(bundle)) } // Pass bundle data
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadBundles();
      }
    });
  }

  confirmAndDeactivate(bundle: IBundle): void {
    const studentName = typeof bundle.student === 'object' ? bundle.student.displayName : 'the student';
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Deactivate Bundle',
        message: `Are you sure you want to deactivate the bundle for ${studentName}? It will be hidden but not permanently deleted.`,
        confirmText: 'Deactivate',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.bundleService.setBundleActiveStatus(bundle._id, false).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle deactivated successfully.');
          this.loadBundles();
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to deactivate bundle.');
        }
      });
    });
  }

  approveBundle(bundle: IBundle): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Approve Bundle',
        message: 'Are you sure you want to approve this bundle?',
        confirmText: 'Approve',
        color: 'primary'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.bundleService.setBundleStatus(bundle._id, EBundleStatus.Approved).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle approved.');
          this.loadBundles();
        },
        error: (err) => this.notificationService.showError(err.error?.message || 'Failed to approve bundle.')
      });
    });
  }

  denyBundle(bundle: IBundle): void {
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Deny Bundle',
        message: 'Are you sure you want to deny this bundle?',
        confirmText: 'Deny',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result === true)).subscribe(() => {
      this.bundleService.setBundleStatus(bundle._id, EBundleStatus.Denied).subscribe({
        next: () => {
          this.notificationService.showSuccess('Bundle denied.');
          this.loadBundles();
        },
        error: (err) => this.notificationService.showError(err.error?.message || 'Failed to deny bundle.')
      });
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
      const searchTerms = JSON.stringify(data).toLowerCase();
      return searchTerms.indexOf(filter) !== -1;
    };
    return filterFunction;
  }
}


import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { BundleService } from '../../../../services/bundle-service';
import { IBundle, IPopulatedUser } from '../../../../models/interfaces/IBundle.interface';
import { MatTabsModule } from "@angular/material/tabs";
import { MissionsModal } from '../components/missions-modal/missions-modal';
import { MissionsTable } from '../components/missions-table/missions-table';
import { MatDialog } from '@angular/material/dialog';
import { IUser } from '../../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-student-information-page',
  imports: [CommonModule, DatePipe, TitleCasePipe, MatCardModule, MatProgressSpinnerModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatListModule, MatTabsModule, MissionsTable],
  templateUrl: './student-information-page.html',
  styleUrl: './student-information-page.scss'
})
export class StudentInformationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bundleService = inject(BundleService);
  private dialog = inject(MatDialog);
  public bundle: IBundle | null = null;
  public isLoading = true;
  public bundleNotFound = false;
  public bundleId: string | null = null;

  ngOnInit(): void {
    
    const bundleId = this.route.snapshot.paramMap.get('id');

    if (!bundleId) {
      this.bundleNotFound = true;
      this.isLoading = false;
      return;
    }else{
      this.bundleId = bundleId;
    }

    this.bundleService.getBundleById(bundleId).subscribe({
      next: (bundle) => {
        if (bundle) {
          this.bundle = bundle;
        } else {
          this.bundleNotFound = true;
        }
        //console.log("Bundle data received:", this.bundle);
        this.isLoading = false;
      },
      error: () => {
        this.bundleNotFound = true;
        this.isLoading = false;
      }
    });
  }

  openCreateDialog(): void {
    if (this.bundle?.student && typeof this.bundle.student === 'object' && this.bundleId) {
      const dialogRef = this.dialog.open(MissionsModal, {
        width: '500px',
        panelClass: 'missions-dialog-container',
        data: {
          student: this.bundle.student as IUser,
          bundleId: this.bundleId // Pass the bundleId to the modal
        }
      });
      
      // When the dialog closes, reload the missions table
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
            // We need a way to tell the child component to reload.
            // A simple but effective way is to quickly set the bundleId to null and then back.
            const currentId = this.bundleId;
            this.bundleId = null;
            setTimeout(() => this.bundleId = currentId, 0);
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/dashboard/students']);
  }
  getDisplayName(user: string | IPopulatedUser): string {
    if (typeof user === 'object' && user.displayName) {
      return user.displayName;
    }
    // You can decide what to show if it's just a string ID, e.g., the ID itself or a placeholder.
    return 'N/A';
  }

}

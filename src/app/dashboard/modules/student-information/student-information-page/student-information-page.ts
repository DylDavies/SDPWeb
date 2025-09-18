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

@Component({
  selector: 'app-student-information-page',
  imports: [CommonModule, DatePipe, TitleCasePipe, MatCardModule, MatProgressSpinnerModule,
    MatIconModule, MatButtonModule, MatDividerModule, MatListModule, MatTabsModule],
  templateUrl: './student-information-page.html',
  styleUrl: './student-information-page.scss'
})
export class StudentInformationPage implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private bundleService = inject(BundleService);

  public bundle: IBundle | null = null;
  public isLoading = true;
  public bundleNotFound = false;

  ngOnInit(): void {
    const bundleId = this.route.snapshot.paramMap.get('id');
    if (!bundleId) {
      this.bundleNotFound = true;
      this.isLoading = false;
      return;
    }

    this.bundleService.getBundleById(bundleId).subscribe({
      next: (bundle) => {
        if (bundle) {
          this.bundle = bundle;
        } else {
          this.bundleNotFound = true;
        }
        this.isLoading = false;
      },
      error: () => {
        this.bundleNotFound = true;
        this.isLoading = false;
      }
    });
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

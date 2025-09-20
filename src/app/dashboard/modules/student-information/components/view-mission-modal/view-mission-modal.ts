import { Component, inject, OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { MissionService } from '../../../../../services/missions-service';
import { NotificationService } from '../../../../../services/notification-service';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-view-mission-modal',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule
  ],
  templateUrl: './view-mission-modal.html',
  styleUrls: ['./view-mission-modal.scss']
})
export class ViewMissionModal implements OnInit, OnDestroy {
  public dialogRef = inject(MatDialogRef<ViewMissionModal>);
  public data: IMissions = inject(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);
  private missionService = inject(MissionService);
  private notificationService = inject(NotificationService);

  public pdfUrl: SafeResourceUrl | null = null;
  public pdfFilename = '';
  public isLoading = true;
  private objectUrl: string | null = null; // Store the raw object URL for cleanup

  ngOnInit(): void {
    if (this.data) {
      this.pdfFilename = this.data.documentName;
      const filename = this.data.documentPath.split(/[\\/]/).pop() || '';

      this.missionService.downloadMissionDocument(filename).subscribe({
        next: (blob) => {
        
          this.objectUrl = URL.createObjectURL(blob);
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(this.objectUrl);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load PDF document:', err);
          this.notificationService.showError('Could not load the mission document.');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    // Revoke the object URL to prevent memory leaks when the component is destroyed
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  downloadDocument(): void {
    const filename = this.data.documentPath.split(/[\\/]/).pop() || this.data.documentName;
    this.missionService.downloadMissionDocument(filename).subscribe({
      next: blob => {
        const a = document.createElement('a');
        const objectUrl = URL.createObjectURL(blob);
        a.href = objectUrl;
        a.download = this.data.documentName;
        a.click();
        URL.revokeObjectURL(objectUrl);
      }, 
      error: error => {
        this.notificationService.showError('Error downloading file.');
        console.error(error);
      }
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

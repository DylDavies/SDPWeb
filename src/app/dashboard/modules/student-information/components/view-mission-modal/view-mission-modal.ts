import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FileService } from '../../../../../services/file-service';
import { SnackBarService } from '../../../../../services/snackbar-service';

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
  private fileService = inject(FileService);
  private snackBarService = inject(SnackBarService);

  public pdfUrl: SafeResourceUrl | null = null;
  public pdfFilename = '';
  public isLoading = true;
  private objectUrl: string | null = null;

  ngOnInit(): void {
    if (this.data && this.data.document) {
      this.pdfFilename = this.data.document.originalFilename;
      this.fileService.getPresignedDownloadUrl(this.data.document._id).subscribe({
        next: (response) => {
          this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(response.url);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Failed to load PDF document:', err);
          this.snackBarService.showError('Could not load the mission document.');
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  ngOnDestroy(): void {
    if (this.objectUrl) {
      URL.revokeObjectURL(this.objectUrl);
    }
  }

  close(): void {
    this.dialogRef.close();
  }
}
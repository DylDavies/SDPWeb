import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { environment } from '../../../../../../environments/environment';
import { MissionService } from '../../../../../services/missions-service';
import { NotificationService } from '../../../../../services/notification-service';

@Component({
  selector: 'app-view-mission-modal',
  standalone: true,
  imports: [
    CommonModule, MatDialogModule, MatButtonModule, MatIconModule
  ],
  templateUrl: './view-mission-modal.html',
  styleUrls: ['./view-mission-modal.scss']
})
export class ViewMissionModal implements OnInit {
  public dialogRef = inject(MatDialogRef<ViewMissionModal>);
  public data: IMissions = inject(MAT_DIALOG_DATA);
  private sanitizer = inject(DomSanitizer);
  private missionService = inject(MissionService);
  private notificationService = inject(NotificationService);


  public pdfUrl: SafeResourceUrl | null = null;
  public pdfFilename = '';

  ngOnInit(): void {
    if (this.data) {
        this.pdfFilename = this.data.documentName;
        const filename = this.data.documentPath.split(/[\\/]/).pop() || '';
        const unsafeUrl = `${environment.apiUrl}/missions/document/${filename}`;
        this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(unsafeUrl);
    }
  }

  downloadDocument(): void {
    const filename = this.data.documentPath.split(/[\\/]/).pop() || this.data.documentName;
    this.missionService.downloadMissionDocument(filename).subscribe(blob => {
      const a = document.createElement('a');
      const objectUrl = URL.createObjectURL(blob);
      a.href = objectUrl;
      a.download = this.data.documentName;
      a.click();
      URL.revokeObjectURL(objectUrl);
    }, error => {
      this.notificationService.showError('Error downloading file.');
      console.error(error);
    });
  }

  close(): void {
    this.dialogRef.close();
  }
}

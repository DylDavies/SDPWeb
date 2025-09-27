import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatCardModule } from '@angular/material/card';
import { SnackBarService } from '../../../services/snackbar-service';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatCardModule,
  ],
  templateUrl: './file-upload-component.html',
  styleUrls: ['./file-upload-component.scss'],
})
export class FileUploadComponent {
  @Input() allowedFileTypes: string[] = ['application/pdf', 'image/*', 'audio/*'];
  @Input() maxFileSizeMB = 10;
  @Output() fileSelected = new EventEmitter<File>();
  @Output() uploadTriggered = new EventEmitter<File>();

  public selectedFile: File | null = null;
  public isUploading = false;
  public uploadProgress = 0;

  constructor(private snackbarService: SnackBarService) {}

  get acceptFileTypes(): string {
    return this.allowedFileTypes.join(',');
  }

  onFileSelected(event: Event): void {
    const element = event.currentTarget as HTMLInputElement;
    const fileList: FileList | null = element.files;
    if (fileList && fileList.length > 0) {
      const file = fileList[0];
      if (this.isValidFile(file)) {
        this.selectedFile = file;
        this.fileSelected.emit(this.selectedFile);
      }
    }
  }

  isValidFile(file: File): boolean {
    if (file.size > this.maxFileSizeMB * 1024 * 1024) {
      this.snackbarService.showError(
        `File is too large. Maximum size is ${this.maxFileSizeMB}MB.`
      );
      return false;
    }

    const fileType = file.type;
    const isAllowed = this.allowedFileTypes.some((allowedType) => {
      if (allowedType.endsWith('/*')) {
        return fileType.startsWith(allowedType.slice(0, -2));
      }
      return fileType === allowedType;
    });

    if (!isAllowed) {
      this.snackbarService.showError(`Invalid file type. Please select a valid file.`);
      return false;
    }

    return true;
  }

  triggerUpload(): void {
    if (this.selectedFile) {
      this.isUploading = true;
      this.uploadProgress = 0;

      const interval = setInterval(() => {
        this.uploadProgress += 10;
        if (this.uploadProgress >= 100) {
          clearInterval(interval);
          this.isUploading = false;
          this.uploadTriggered.emit(this.selectedFile as File);
        }
      }, 200);
    }
  }

  clearSelection(): void {
    this.selectedFile = null;
  }
}
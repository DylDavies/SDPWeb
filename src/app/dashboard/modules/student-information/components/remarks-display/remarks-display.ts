import { Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription } from 'rxjs';
import { IRemark } from '../../../../../models/interfaces/IRemark.interface';
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { RemarkService } from '../../../../../services/remark-service';
import { FileService } from '../../../../../services/file-service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-remarks-display',
  standalone: true,
  imports: [
    CommonModule, MatIconModule, MatProgressSpinnerModule, MatDividerModule, DatePipe, MatButtonModule, MatTooltipModule
  ],
  templateUrl: './remarks-display.html',
  styleUrls: ['./remarks-display.scss']
})
export class RemarksDisplay implements OnInit, OnChanges, OnDestroy {
  @Input() studentId: string | null = null;
  private remarkService = inject(RemarkService);
  private fileService = inject(FileService);
  private sanitizer = inject(DomSanitizer);
  private dialog = inject(MatDialog);

  public sortedRemarks: IRemark[] = [];
  public isLoading = true;
  public expandedRemarks = new Set<string>();

  private subscriptions = new Subscription();

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['studentId'] && changes['studentId'].currentValue) {
      this.loadRemarks();
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  loadRemarks(): void {
    if (!this.studentId) return;

    this.isLoading = true;
    this.subscriptions.add(
      this.remarkService.getRemarksForStudent(this.studentId).subscribe(remarks => {
        this.sortedRemarks = this.sortRemarksChronologically(remarks);
        this.isLoading = false;
      })
    );
  }

  sortRemarksChronologically(remarks: IRemark[]): IRemark[] {
    return remarks.sort((a, b) => {
      const dateA = this.getEventDate(a);
      const dateB = this.getEventDate(b);
      if (!dateA || !dateB) return 0;
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  }

  getTutorName(remark: IRemark): string {
    if (remark.event && typeof remark.event === 'object') {
      const event = remark.event as any;
      const tutor = event.tutor as IPopulatedUser;
      return tutor?.displayName || 'Unknown Tutor';
    }
    return 'Unknown Tutor';
  }

  getSubject(remark: IRemark): string {
    if (remark.event && typeof remark.event === 'object') {
      const event = remark.event as any;
      return event.subject || 'Unknown Subject';
    }
    return 'Unknown Subject';
  }

  getRemarkValue(remark: IRemark, fieldName: string): string | number | boolean | Date | IDocument | null {
    const entry = remark.entries.find(e => e.field === fieldName);
    return entry ? entry.value : 'N/A';
  }

  formatValue(value: string | number | boolean | Date | IDocument | null, type: string): string {
    if (value === null || value === undefined) {
      return 'N/A';
    }
    if (type === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (typeof value === 'object' && 'originalFilename' in value) {
      return value.originalFilename;
    }
    return String(value);
  }

  getEventDate(remark: IRemark): Date | null {
    if (remark.event && typeof remark.event === 'object') {
      const event = remark.event as any;
      return event.startTime ? new Date(event.startTime) : null;
    }
    return null;
  }

  toggleRemark(remarkId: string): void {
    if (this.expandedRemarks.has(remarkId)) {
      this.expandedRemarks.delete(remarkId);
    } else {
      this.expandedRemarks.add(remarkId);
    }
  }

  isExpanded(remarkId: string): boolean {
    return this.expandedRemarks.has(remarkId);
  }

  isFileField(fieldType: string): boolean {
    return fieldType === 'pdf' || fieldType === 'image' || fieldType === 'audio';
  }

  isDocument(value: any): boolean {
    return value && typeof value === 'object' && '_id' in value && 'fileKey' in value;
  }

  getDocument(value: any): IDocument | null {
    return this.isDocument(value) ? value as IDocument : null;
  }

  downloadFile(document: IDocument): void {
    this.fileService.getPresignedDownloadUrl(document._id).subscribe({
      next: (response) => {
        window.open(response.url, '_blank');
      },
      error: (err) => {
        console.error('Failed to download file:', err);
      }
    });
  }

  isImageFile(document: IDocument): boolean {
    return document.contentType.startsWith('image/');
  }

  isAudioFile(document: IDocument): boolean {
    return document.contentType.startsWith('audio/');
  }

  isPdfFile(document: IDocument): boolean {
    return document.contentType === 'application/pdf';
  }
}

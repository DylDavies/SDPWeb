import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { MatDividerModule } from '@angular/material/divider';
import { EventService } from '../../../../../services/event-service';
import { NotificationService } from '../../../../../services/notification-service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { filter } from 'rxjs';
import { AddEventModal } from '../add-event-modal/add-event-modal';
import { AddRemarkModal } from '../add-remark-modal/add-remark-modal';
import { IRemark } from '../../../../../models/interfaces/IRemark.interface';
import { RemarkService } from '../../../../../services/remark-service';
import { AuthService } from '../../../../../services/auth-service';
import { EUserType } from '../../../../../models/enums/user-type.enum';

@Component({
  selector: 'app-remark-modal',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule
  ],
  templateUrl: './remark-modal.html',
  styleUrls: ['./remark-modal.scss']
})
export class RemarkModal implements OnInit {
  public dialogRef = inject(MatDialogRef<RemarkModal>);
  public data: { event: IEvent } = inject(MAT_DIALOG_DATA);
  private eventService = inject(EventService);
  private remarkService = inject(RemarkService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);
  private authService = inject(AuthService);

  public remark: IRemark | null = null;
  public isRemarked = false;
  public rating: number | undefined = undefined;
  public hoveredStar = 0;
  public isPastEvent = false;
  public isStudent = false;

  ngOnInit(): void {
    this.isRemarked = this.data.event.remarked;
    this.rating = this.data.event.rating;
    this.isPastEvent = new Date(this.data.event.startTime) < new Date();
    this.authService.currentUser$.subscribe(user => {
        this.isStudent = user?.type === EUserType.Client;
    });
  }

  onClose(result?: boolean): void {
    this.dialogRef.close(result);
  }

  onDelete(): void {
    if (this.isRemarked) {
        this.notificationService.showError("Cannot delete a remarked event.");
        return;
    }
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Event',
        message: `Are you sure you want to delete this event?`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result)).subscribe(() => {
      this.eventService.deleteEvent(this.data.event._id).subscribe({
        next: () => {
          this.notificationService.showSuccess('Event deleted successfully!');
          this.onClose(true);
        },
        error: (err) => {
          this.notificationService.showError(err.error?.message || 'Failed to delete event.');
        }
      });
    });
  }

  onEdit(): void {
    if (this.isRemarked) {
        this.notificationService.showError("Cannot edit a remarked event.");
        return;
    }
    const dialogRef = this.dialog.open(AddEventModal, {
      width: '500px',
      data: { date: this.data.event.startTime, event: this.data.event }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.onClose(true);
      }
    });
  }

  addOrEditRemark(): void {
    if (this.isRemarked) {
        this.remarkService.getRemarkForEvent(this.data.event._id).subscribe(remark => {
            if (remark) {
                this.openRemarkDialog(remark);
            }
        });
    } else {
        this.openRemarkDialog();
    }
  }
  
  private openRemarkDialog(remark?: IRemark): void {
  const dialogRef = this.dialog.open(AddRemarkModal, {
    width: '80vw', // 80% of the viewport width
    panelClass: 'remark-dialog-container', // This is the crucial part
    data: { event: this.data.event, remark }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      this.onClose(true);
    }
  });
}

  rateEvent(rating: number): void {
    if (this.rating) return;
    this.eventService.rateEvent(this.data.event._id, rating).subscribe({
        next: (updatedEvent) => {
            this.notificationService.showSuccess('Event rated successfully!');
            this.rating = updatedEvent.rating;
            this.onClose(true);
        },
        error: (err) => {
            this.notificationService.showError(err.error?.message || 'Failed to rate event.');
        }
    });
  }

  setHoveredStar(star: number): void {
    if (this.rating) return;
    this.hoveredStar = star;
  }
  
  clearHoveredStar(): void {
    this.hoveredStar = 0;
  }

  getEventTime(event: IEvent): string {
    const startTime = new Date(event.startTime);
    const endTime = new Date(startTime.getTime() + event.duration * 60000);

    const formatTime = (date: Date) => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    return `${formatTime(startTime)} - ${formatTime(endTime)}`;
  }
}
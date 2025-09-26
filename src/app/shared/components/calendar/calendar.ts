import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
// Correct the import path for the modal
import { AddEventModal } from '../../../dashboard/modules/client-dashboard/components/add-event-modal/add-event-modal';
import { IEvent } from '../../../models/interfaces/IEvent.interface';
import { SocketService } from '../../../services/socket-service';
import { ESocketMessage } from '../../../models/enums/socket-message.enum';
import { EventService } from '../../../services/event-service';
import { RemarkModal } from '../../../dashboard/modules/client-dashboard/components/remark-modal/remark-modal';
import { AuthService } from '../../../services/auth-service';
import { EUserType } from '../../../models/enums/user-type.enum';
import { IUser } from '../../../models/interfaces/IUser.interface';

@Component({
  selector: 'app-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './calendar.html',
  styleUrls: ['./calendar.scss']
})
export class CalendarComponent implements OnInit {
  private dialog = inject(MatDialog);
  private eventService = inject(EventService);
  private socketService = inject(SocketService);
  private authService = inject(AuthService);

  public currentDate: Date = new Date();
  public daysInMonth: (Date | null)[] = [];
  public events: IEvent[] = [];
  public monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  public weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  public isStaffOrAdmin = false;
  private currentUser: IUser | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isStaffOrAdmin = user?.type === EUserType.Staff || user?.type === EUserType.Admin;
    });

    this.generateCalendarDays();
    this.loadEvents();

    this.socketService.subscribe(ESocketMessage.EventsUpdated);
    this.socketService.listen(ESocketMessage.EventsUpdated).subscribe(() => {
        this.loadEvents();
    });
  }

  loadEvents(): void {
      this.eventService.getEvents().subscribe(events => {
          this.events = events.map(e => ({
              ...e,
              startTime: new Date(e.startTime)
          }));
      });
  }

  getEventStatusIcon(event: IEvent): 'completed' | 'pending' | null {
    const isPast = new Date(event.startTime) < new Date();
    if (!isPast) return null;
  
    if (this.currentUser?.type === EUserType.Client) {
      return event.rating ? 'completed' : 'pending';
    } else {
      if (event.remarked) return 'completed';
      return event.rating ? null : 'pending';
    }
  }

  generateCalendarDays(): void {
    this.daysInMonth = [];
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDay = firstDayOfMonth.getDay();

    for (let i = 0; i < startingDay; i++) {
      this.daysInMonth.push(null);
    }

    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      this.daysInMonth.push(new Date(year, month, i));
    }
  }

  previousMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendarDays();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
  }

  onDayClick(day: Date | null): void {
    if (!day || !this.isStaffOrAdmin) return;

    const dialogRef = this.dialog.open(AddEventModal, {
      width: '500px',
      //height: '520px',
      data: { date: day }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents();
      }
    });
  }

  onEventClick(event: IEvent, domEvent: MouseEvent): void {
    domEvent.stopPropagation(); // Prevent the onDayClick from firing
    const dialogRef = this.dialog.open(RemarkModal, {
      width: '500px',
      data: { event }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadEvents();
      }
    });
  }

  /**
   * Calculates and formats the start time of an event for display.
   * @param {IEvent} event - The event object.
   * @returns {string} A formatted time string (e.g., "09:00").
   */
  getEventTime(event: IEvent): string {
    const startTime = new Date(event.startTime);
    return startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  getEventsForDay(day: Date | null): IEvent[] {
    if (!day) return [];
    return this.events
      .filter(event => new Date(event.startTime).toDateString() === day.toDateString())
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  }
}
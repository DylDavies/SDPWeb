import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
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
  private cdr = inject(ChangeDetectorRef);

  public currentDate: Date = new Date();
  public daysInMonth: (Date | null)[] = [];
  public events: IEvent[] = [];
  public monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  public weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  public isStaffOrAdmin = false;
  private currentUser: IUser | null = null;
  public selectedDay: Date | null = null;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      this.isStaffOrAdmin = user?.type === EUserType.Staff || user?.type === EUserType.Admin;
    });

    this.generateCalendarDays();
    this.loadEvents();

    this.socketService.subscribe(ESocketMessage.EventsUpdated);
    this.socketService.listen(ESocketMessage.EventsUpdated).subscribe(() => {
      // When events are updated from another source, keep the current day selected
      const dayToKeepSelected = this.selectedDay;
      this.loadEvents(dayToKeepSelected);
    });
  }

  loadEvents(dayToSelectAfterLoad?: Date | null): void {
      this.eventService.getEvents().subscribe(events => {
          let filteredEvents = events.map(e => ({
              ...e,
              startTime: new Date(e.startTime)
          }));

          // Filter events based on user type
          if (this.currentUser && this.currentUser.type !== EUserType.Admin) {
              filteredEvents = filteredEvents.filter(event => {
                  if (this.currentUser!.type === EUserType.Client) {
                      // Clients see events where they are the student
                      if (!event.student) return false;
                      const studentId = typeof event.student === 'object' ? event.student._id : event.student;
                      return studentId === this.currentUser?._id;
                  } else {
                      // Staff/Tutors see events where they are the tutor
                      if (!event.tutor) return false;
                      const tutorId = typeof event.tutor === 'object' ? event.tutor._id : event.tutor;
                      return tutorId === this.currentUser?._id;
                  }
              });
          }

          this.events = filteredEvents;

          // If a specific day should be selected, select it. Otherwise, use the default logic.
          if (dayToSelectAfterLoad) {
              this.selectedDay = dayToSelectAfterLoad;
          } else {
              this.setInitialSelectedDay();
          }

          this.cdr.detectChanges();
      });
  }

  private setInitialSelectedDay(): void {
    const today = new Date();
    const todayString = today.toDateString();

    // Prioritize today if it has events
    if (this.events.some(e => new Date(e.startTime).toDateString() === todayString)) {
      this.selectedDay = today;
      return;
    }

    // Otherwise, find the first day in the current month view that has an event
    const firstDayWithEvent = this.daysInMonth.find(day => 
      day && this.getEventsForDay(day).length > 0
    );

    // Fallback to today if no days in the current view have events
    this.selectedDay = firstDayWithEvent || today;
  }

  getEventStatusIcon(event: IEvent): 'completed' | 'pending' | null {
    const isPast = new Date(event.startTime) < new Date();
    if (!isPast) return null;
  
    if (this.currentUser?.type === EUserType.Client) {
      return event.rating ? 'completed' : 'pending';
    } else {
      return event.remarked ? 'completed' : 'pending';
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
    this.setInitialSelectedDay();
  }

  nextMonth(): void {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendarDays();
    this.setInitialSelectedDay();
  }

  openAddEventDialog(day: Date | null): void {
    if (!this.isStaffOrAdmin) return;
    
    // Ensure we are passing the correct date to the dialog
    const dateForDialog = day || this.selectedDay || new Date();

    const dialogRef = this.dialog.open(AddEventModal, {
      width: '500px',
      data: { date: dateForDialog }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // After adding an event, reload the events but keep the same day selected.
        this.loadEvents(dateForDialog);
      }
    });
  }
  
  selectDay(day: Date | null): void {
    if (day) {
        this.selectedDay = day;
    }
  }

  isSameDay(date1: Date | null, date2: Date | null): boolean {
    if (!date1 || !date2) return false;
    return date1.toDateString() === date2.toDateString();
  }

  onEventClick(event: IEvent, domEvent: MouseEvent): void {
    domEvent.stopPropagation(); // Prevent the onDayClick from firing
    const dialogRef = this.dialog.open(RemarkModal, {
      width: '500px',
      data: { event }
    });
  
    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Keep the same day selected after a remark is added/updated
        this.loadEvents(this.selectedDay);
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

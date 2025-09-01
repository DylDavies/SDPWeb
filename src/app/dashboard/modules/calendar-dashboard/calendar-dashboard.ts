import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { AddEventModal } from './components/add-event-modal/add-event-modal';
import { ICalendarEvent } from '../../../models/interfaces/ICalendarEvent.interface';

@Component({
  selector: 'app-calendar-dashboard',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatDialogModule],
  templateUrl: './calendar-dashboard.html',
  styleUrls: ['./calendar-dashboard.scss']
})
export class CalendarDashboard implements OnInit {
  private dialog = inject(MatDialog);

  public currentDate: Date = new Date();
  public daysInMonth: (Date | null)[] = [];
  public events: ICalendarEvent[] = [];
  public monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  public weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.generateCalendarDays();
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
    if (!day) return;

    const dialogRef = this.dialog.open(AddEventModal, {
      width: '400px',
      height: '410px',
      data: { date: day }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        const { name, startTime, duration } = result;
        const endTime = this.calculateEndTime(startTime, duration);

        const newEvent: ICalendarEvent = {
          id: Date.now().toString(),
          date: day,
          name,
          startTime,
          endTime
        };
        this.events.push(newEvent);
      }
    });
  }

  private calculateEndTime(startTime: string, durationInMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startDate = new Date();
    startDate.setHours(hours, minutes);
    
    const endDate = new Date(startDate.getTime() + durationInMinutes * 60000);

    const endHours = endDate.getHours().toString().padStart(2, '0');
    const endMinutes = endDate.getMinutes().toString().padStart(2, '0');

    return `${endHours}:${endMinutes}`;
  }

  getEventsForDay(day: Date | null): ICalendarEvent[] {
    if (!day) return [];
    return this.events
      .filter(event => event.date.toDateString() === day.toDateString())
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  }
}
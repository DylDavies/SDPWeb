import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { StudyGroupService } from '../../../../../services/study-group-service';
import { IStudyGroupEvent } from '../../../../../models/interfaces/IStudyGroupEvent.interface';
import { SnackBarService } from '../../../../../services/snackbar-service';

@Component({
  selector: 'app-study-group-calendar',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  templateUrl: './study-group-calendar.html',
  styleUrls: ['./study-group-calendar.scss']
})
export class StudyGroupCalendarComponent implements OnInit {
  private studyGroupService = inject(StudyGroupService);
  private snackbarService = inject(SnackBarService);

  public currentDate: Date = new Date();
  public daysInMonth: (Date | null)[] = [];
  public events: IStudyGroupEvent[] = [];
  public monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  public weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  ngOnInit(): void {
    this.generateCalendarDays();
    this.loadEvents();
  }

  loadEvents(): void {
      this.studyGroupService.getUpcomingStudyGroups().subscribe({
        next: (studyGroups) => {
          this.events = studyGroups.map(sg => ({
              id: sg.id,
              date: new Date(sg.scheduled_start),
              name: sg.name,
              startTime: new Date(sg.scheduled_start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }),
              endTime: new Date(sg.scheduled_end).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
          }));
        },
        error: () => {
          this.snackbarService.showError('Could not load upcoming study groups. Please try again later.');
        }
      });
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

  getEventTime(event: IStudyGroupEvent): string {
    return event.startTime;
  }

  getEventsForDay(day: Date | null): IStudyGroupEvent[] {
    if (!day) return [];
    return this.events
      .filter(event => event.date.toDateString() === day.toDateString())
      .sort((a, b) => a.date.getTime() - b.date.getTime());
  }
}

import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { WelcomeCard } from './components/welcome-card/welcome-card';
import { CalendarComponent } from '../../../shared/components/calendar/calendar';
import { StudyGroupCalendarComponent } from './components/study-group-calendar/study-group-calendar';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, WelcomeCard, CalendarComponent, StudyGroupCalendarComponent],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ClientDashboard {

}
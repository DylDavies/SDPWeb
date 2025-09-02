import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTabsModule } from '@angular/material/tabs';
import { MatIconModule } from '@angular/material/icon';
import { UpcomingStudyGroupsTable } from './components/upcoming-study-groups-table/upcoming-study-groups-table';
import { WelcomeCard } from './components/welcome-card/welcome-card';
import { CalendarComponent } from '../../../shared/components/calendar/calendar';

@Component({
  selector: 'app-client-dashboard',
  standalone: true,
  imports: [CommonModule, MatTabsModule, MatIconModule, UpcomingStudyGroupsTable, WelcomeCard, CalendarComponent],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss'
})
export class ClientDashboard {

}


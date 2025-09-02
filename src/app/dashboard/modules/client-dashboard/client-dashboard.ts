import { Component } from '@angular/core';
import { WelcomeCard } from "./components/welcome-card/welcome-card";
import { CalendarComponent } from '../../../shared/components/calendar/calendar';

@Component({
  selector: 'app-client-dashboard',
  imports: [WelcomeCard, CalendarComponent],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss'
})
export class ClientDashboard {

}
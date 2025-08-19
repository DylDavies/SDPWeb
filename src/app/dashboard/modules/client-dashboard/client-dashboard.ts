import { Component } from '@angular/core';
import { WelcomeCard } from "./components/welcome-card/welcome-card";

@Component({
  selector: 'app-client-dashboard',
  imports: [WelcomeCard],
  templateUrl: './client-dashboard.html',
  styleUrl: './client-dashboard.scss'
})
export class ClientDashboard {

}

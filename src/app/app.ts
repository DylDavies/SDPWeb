import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Navbar } from './shared/components/navbar/navbar';
import { Topbar } from './shared/components/topbar/topbar';
import { AdminDashboard } from "./dashboard/modules/admin-dashboard/admin-dashboard";
import { ButtonGoogle } from './shared/components/button/modules/button-google/button-google';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Navbar, Topbar, AdminDashboard, ButtonGoogle],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('SDPWeb');
}

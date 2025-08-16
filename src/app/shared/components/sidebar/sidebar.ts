import { Component, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from "@angular/material/sidenav";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ISidebarItem } from '../../../models/interfaces/ISidebarItem.interface';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    RouterOutlet,
    RouterLink,
    CommonModule,
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  /**
   * List storing information on the items on the Sidebar
   */
  sideBarLinks: ISidebarItem[] = [
    { label: 'Client Dashboard', icon: 'dashboard', route: '/dashboard/client' },
    { label: 'Admin Dashboard', icon: 'dashboard', route: '/dashboard/admin' },
    { label: 'Login', icon: 'login', route: '/login' },
  ]
  
  toggleSidenav() {
    this.sidenav.toggle();
  }
}

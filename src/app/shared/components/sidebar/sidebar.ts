import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from "@angular/material/sidenav";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ISidebarItem } from '../../../models/interfaces/ISidebarItem.interface';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';

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
export class Sidebar implements OnInit {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  public user: IUser | null = null;

  /**
   * List storing information on the items on the Sidebar
   */
  sideBarLinks: ISidebarItem[] = [
    { label: 'Home', icon: 'dashboard', route: '/dashboard/client' }
  ]

  public authService = inject(AuthService);

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
      }
    })
  }
  
  toggleSidenav() {
    this.sidenav.toggle();
  }
}

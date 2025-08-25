import { Component, inject, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from "@angular/material/sidenav";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet } from '@angular/router';
import { ISidebarItem } from '../../../models/interfaces/ISidebarItem.interface';
import { AsyncPipe, CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';
import { Observable } from 'rxjs';
import { EPermission } from '../../../models/enums/permission.enum';
import { EUserType } from '../../../models/enums/user-type.enum';

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
    DisplayNamePipe,
    AsyncPipe
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
    { label: 'Home', icon: 'dashboard', route: '/dashboard' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile' },
    { label: 'Admin', icon: 'shield', route: '/dashboard/admin', requiredPermissions: [EPermission.ADMIN_DASHBOARD_VIEW] }
  ]

  public authService = inject(AuthService);

  public currentUser$: Observable<IUser | null>;

  constructor() {
    this.currentUser$ = this.authService.currentUser$;
  }
  
  toggleSidenav() {
    this.sidenav.toggle();
  }
  
  public canView(requiredPermissions: EPermission[] | undefined) {
    if (!requiredPermissions || requiredPermissions.length == 0) return true;

    const user = this.authService.currentUserValue;

    if (user && user.type == EUserType.Admin) return true;

    return requiredPermissions.every(p => this.authService.hasPermission(p));
  }
}

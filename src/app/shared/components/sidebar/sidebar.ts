import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';
import { Subscription } from 'rxjs';
import { EPermission } from '../../../models/enums/permission.enum';
import { EUserType } from '../../../models/enums/user-type.enum';
import { ThemeToggleButton } from '../theme-toggle-button/theme-toggle-button';

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
    ThemeToggleButton
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  /**
   * List storing information on the items on the Sidebar
   */
  sideBarLinks: ISidebarItem[] = [
    { label: 'Home', icon: 'dashboard', route: '/dashboard' },
    { label: 'Profile', icon: 'person', route: '/dashboard/profile' },
    { label: 'User Management', icon: 'people', route: '/dashboard/users', requiredPermissions: [EPermission.USERS_VIEW] },
    { 
      label: 'Bundles', 
      icon: 'inventory', 
      route: '/dashboard/bundles', 
      requiredPermissions: [
        EPermission.BUNDLES_VIEW,
        EPermission.BUNDLES_CREATE,
        EPermission.BUNDLES_EDIT,
        EPermission.BUNDLES_DELETE
      ] 
    },
    { label: 'Admin', icon: 'shield', route: '/dashboard/admin', requiredPermissions: [EPermission.ADMIN_DASHBOARD_VIEW] },
    { label: 'Badge Library', icon: 'military_tech', route: '/dashboard/badges', requiredPermissions: [EPermission.BADGES_VIEW] },
  ]

  public authService = inject(AuthService);

  public user: IUser | null = null;
  private userSubscription: Subscription | null = null;

  ngOnInit(): void {
    this.userSubscription = this.authService.currentUser$.subscribe((user) => this.user = user);
  }

  ngOnDestroy(): void {
      if (this.userSubscription) this.userSubscription.unsubscribe();
  }
  
  toggleSidenav() {
    this.sidenav.toggle();
  }
  
  public canView(requiredPermissions: EPermission[] | undefined) {
    if (!requiredPermissions || requiredPermissions.length == 0) return true;

    if (this.user && this.user.type == EUserType.Admin) return true;

    return requiredPermissions.every(p => this.authService.hasPermission(p)); 
  }
}
import { Component, inject, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { MatSidenavModule, MatSidenav } from "@angular/material/sidenav";
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink, RouterOutlet, RouterLinkActive  } from '@angular/router';
import { ISidebarItem } from '../../../models/interfaces/ISidebarItem.interface';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { DisplayNamePipe } from '../../../pipes/display-name-pipe-pipe';
import { Subscription } from 'rxjs';
import { EPermission } from '../../../models/enums/permission.enum';
import { EUserType } from '../../../models/enums/user-type.enum';
import { ThemeToggleButton } from '../theme-toggle-button/theme-toggle-button';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { SidebarService } from '../../../services/sidebar-service';
import { MatExpansionModule } from '@angular/material/expansion';

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
    ThemeToggleButton,
    MatExpansionModule,
    RouterLinkActive
  ],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;

  public isMobile = false;
  private breakpointObserver = inject(BreakpointObserver);

  public authService = inject(AuthService);
  public sideBarService = inject(SidebarService);

  public user: IUser | null = null;
  private userSubscription: Subscription | null = null;

  public sideBarLinks: ISidebarItem[] = []; 
  private sideBarSubscription: Subscription | null = null;

  ngOnInit(): void {
    setTimeout(() => {
      this.breakpointObserver.observe([
        Breakpoints.XSmall,
        Breakpoints.Small
      ]).subscribe(result => {
        this.isMobile = result.matches;
      });
    }, 100);

    this.userSubscription = this.authService.currentUser$.subscribe((user) => this.user = user);

    this.sideBarSubscription = this.sideBarService.sidebarItems$.subscribe((items) => this.sideBarLinks = items);
  }

  ngOnDestroy(): void {
    if (this.userSubscription) this.userSubscription.unsubscribe();
    if (this.sideBarSubscription) this.sideBarSubscription.unsubscribe();
  }
  
  public canView(requiredPermissions: EPermission[] | undefined) {
    if (!requiredPermissions || requiredPermissions.length == 0) return true;

    if (this.user && this.user.type == EUserType.Admin) return true;

    return requiredPermissions.every(p => this.authService.hasPermission(p)); 
  }

  public shouldShow(item: ISidebarItem) {
    const isCat = (!item.route || item.route == '') && item.children && item.children.length > 0;

    return isCat ? item.children!.some(c => this.canView(c.requiredPermissions)) : this.canView(item.requiredPermissions);
  }
}
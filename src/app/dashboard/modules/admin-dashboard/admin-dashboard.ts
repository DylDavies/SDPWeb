import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { EPermission } from '../../../models/enums/permission.enum';
import { AuthService } from '../../../services/auth-service';
import { RoleManagement } from './components/role-management/role-management';
import { AdminProficiencyManagement } from './components/admin-proficiency-management/admin-proficiency-management';
import { UserTable } from '../../../shared/components/user-table/user-table';
import { SidebarCustomization } from './components/sidebar-customization/sidebar-customization';
import { BadgeManagement } from "./components/badge-management/badge-management";
import { RemarkTemplateManagement } from './components/remark-template-management/remark-template-management';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatTabsModule, MatIconModule, UserTable, RoleManagement, AdminProficiencyManagement, BadgeManagement, SidebarCustomization, RemarkTemplateManagement],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard implements OnInit{
  private authService = inject(AuthService);
  private breakpointObserver = inject(BreakpointObserver);

  public isMobile = false;

  public canViewUsers = this.authService.hasPermission(EPermission.USERS_VIEW);
  public canViewRoles = this.authService.hasPermission(EPermission.ROLES_VIEW);
  public canManageProficiencies = this.authService.hasPermission(EPermission.PROFICIENCIES_MANAGE);
  public canManageSidebar = this.authService.hasPermission(EPermission.SIDEBAR_MANAGE);
  public canManageBadges = this.authService.hasPermission(EPermission.BADGES_CREATE);
  public canManageRemarks = this.authService.hasPermission(EPermission.REMARKS_MANAGE);

  ngOnInit(): void {
    this.breakpointObserver.observe([Breakpoints.Handset, Breakpoints.Tablet]).subscribe(result =>{
      this.isMobile = result.matches;
    })
  }
}
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
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

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatTabsModule, MatIconModule, UserTable, RoleManagement, AdminProficiencyManagement, BadgeManagement, SidebarCustomization, RemarkTemplateManagement],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AdminDashboard {
  private authService = inject(AuthService);

  public canViewUsers = this.authService.hasPermission(EPermission.USERS_VIEW);
  public canViewRoles = this.authService.hasPermission(EPermission.ROLES_VIEW);
  public canManageProficiencies = this.authService.hasPermission(EPermission.PROFICIENCIES_MANAGE);
  public canManageSidebar = this.authService.hasPermission(EPermission.SIDEBAR_MANAGE);
  public canManageBadges = this.authService.hasPermission(EPermission.BADGES_CREATE);
  public canManageRemarks = this.authService.hasPermission(EPermission.REMARKS_MANAGE);
}
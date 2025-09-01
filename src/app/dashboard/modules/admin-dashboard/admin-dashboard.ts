import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { EPermission } from '../../../models/enums/permission.enum';
import { AuthService } from '../../../services/auth-service';
import { RoleManagement } from './components/role-management/role-management';
import { AdminProficiencyManagement } from './components/admin-proficiency-management/admin-proficiency-management';
import { UserTable } from '../../../shared/components/user-table/user-table';

@Component({
  selector: 'app-admin-dashboard',
  imports: [CommonModule, MatTabsModule, MatIconModule, UserTable, RoleManagement, AdminProficiencyManagement],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.scss'
})
export class AdminDashboard {
  private authService = inject(AuthService);

  public canViewUsers = this.authService.hasPermission(EPermission.USERS_VIEW);
  public canViewRoles = this.authService.hasPermission(EPermission.ROLES_VIEW);
  public canManageProficiencies = this.authService.hasPermission(EPermission.PROFICIENCIES_MANAGE);
}

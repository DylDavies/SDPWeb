import { Routes } from '@angular/router';
import { Landing } from './landing/landing';
import { Dashboard } from './dashboard/dashboard';
import { AdminDashboard } from './dashboard/modules/admin-dashboard/admin-dashboard';
import { ClientDashboard } from './dashboard/modules/client-dashboard/client-dashboard';
import { NotFound } from './shared/components/not-found/not-found';
import { authGuard } from './guards/auth-guard';
import { LoginCallback } from './handlers/login-callback/login-callback';
import { loginGuard } from './guards/login-guard';
import { Logout } from './handlers/logout/logout';
import { Profile } from './dashboard/modules/profile-dashboard/profile-dashboard';
import { profileCompletionGuard } from './guards/profile-completion-guard';
import { permissionGuard } from './guards/permission-guard-guard';
import { EPermission } from './models/enums/permission.enum';

export const routes: Routes = [
  { path: '', component: Landing, canActivate: [loginGuard] },
  { path: 'dashboard', component: Dashboard, children: [
      { path: '', component: ClientDashboard },
      { path: 'admin', component: AdminDashboard, canActivate: [permissionGuard([EPermission.ADMIN_DASHBOARD_VIEW])] },
      { path: 'profile', component: Profile}
    ],
    canActivate: [authGuard, profileCompletionGuard]
  },
  { path: 'login/callback', component: LoginCallback },
  { path: 'logout', component: Logout },
  { path: '**', component: NotFound }
];

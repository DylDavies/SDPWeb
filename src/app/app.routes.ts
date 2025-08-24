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
import { BundleDashboard } from './dashboard/modules/bundle-dashboard/bundle-dashboard';

export const routes: Routes = [
  { path: '', component: Landing, canActivate: [loginGuard] },
  { path: 'dashboard', component: Dashboard, children: [
      { path: '', redirectTo: 'client', pathMatch: 'full' },
      { path: 'admin', component: AdminDashboard },
      { path: 'client', component: ClientDashboard },
      { path: 'profile', component: Profile},
      { path: 'bundles', component: BundleDashboard }
    ],
    canActivate: [authGuard, profileCompletionGuard]
  },
  { path: 'login/callback', component: LoginCallback },
  { path: 'logout', component: Logout },
  { path: '**', component: NotFound }
];

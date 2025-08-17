import { Routes } from '@angular/router';
import { Login } from './login/login';
import { Dashboard } from './dashboard/dashboard';
import { AdminDashboard } from './dashboard/modules/admin-dashboard/admin-dashboard';
import { ClientDashboard } from './dashboard/modules/client-dashboard/client-dashboard';

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'dashboard', component: Dashboard, children: [
      { path: 'admin', component: AdminDashboard },
      { path: 'client', component: ClientDashboard },
    ]
  },
  { path: '', redirectTo: '/login', pathMatch: 'full' }, // Default route
  { path: '**', redirectTo: '/login' } // Change to 404 not found page
];

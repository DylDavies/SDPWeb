import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { loginGuard } from './guards/login-guard';
import { profileCompletionGuard } from './guards/profile-completion-guard';
import { permissionGuard } from './guards/permission-guard';
import { EPermission } from './models/enums/permission.enum';
import { accountStatusGuard } from './guards/account-status-guard';

/**
 * Optimized routes with lazy loading for all major modules
 * This significantly reduces the initial bundle size
 */
export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing').then(m => m.Landing),
    canActivate: [loginGuard]
  },
  {
    path: 'account',
    canActivate: [authGuard, accountStatusGuard],
    children: [
      {
        path: 'pending',
        loadComponent: () => import('./status-pages/account-pending/account-pending').then(m => m.AccountPending)
      },
      {
        path: 'disabled',
        loadComponent: () => import('./status-pages/account-disabled/account-disabled').then(m => m.AccountDisabled)
      }
    ]
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard').then(m => m.Dashboard),
    children: [
      {
        path: '',
        loadComponent: () => import('./dashboard/modules/client-dashboard/client-dashboard').then(m => m.ClientDashboard)
      },
      {
        path: 'admin',
        loadComponent: () => import('./dashboard/modules/admin-dashboard/admin-dashboard').then(m => m.AdminDashboard),
        canActivate: [permissionGuard([EPermission.ADMIN_DASHBOARD_VIEW])]
      },
      {
        path: 'admin/payslips',
        loadComponent: () => import("./dashboard/modules/admin-dashboard/components/admin-payslip-dashboard/admin-payslip-dashboard").then(m => m.AdminPayslipDashboard),
        canActivate: [permissionGuard([EPermission.CAN_MANAGE_PAYSLIPS])]
      },
      {
        path: 'admin/payslips/:id',
        loadComponent: () => import("./dashboard/modules/payslip-dashboard/components/payslip-viewer/payslip-viewer").then(m => m.PayslipViewer),
        canActivate: [permissionGuard([EPermission.CAN_MANAGE_PAYSLIPS])]
      },
      {
        path: 'profile',
        loadComponent: () => import('./dashboard/modules/profile-dashboard/profile-dashboard').then(m => m.Profile),
        canActivate: [permissionGuard([EPermission.VIEW_USER_PROFILE])]
      },
      {
        path: 'profile/:id',
        loadComponent: () => import('./dashboard/modules/profile-dashboard/profile-dashboard').then(m => m.Profile),
        canActivate: [permissionGuard([EPermission.USERS_VIEW])]
      },
      {
        path: 'users',
        loadComponent: () => import('./dashboard/modules/user-management/user-management').then(m => m.UserManagement),
        canActivate: [permissionGuard([EPermission.USERS_VIEW])]
      },
      {
        path: 'students',
        loadComponent: () => import('./dashboard/modules/student-management/student-management').then(m => m.StudentManagement)
      },
      {
        path: 'student-info/:id',
        loadComponent: () => import('./dashboard/modules/student-information/student-information-page/student-information-page').then(m => m.StudentInformationPage)
      },
      {
        path: 'bundles',
        loadComponent: () => import('./dashboard/modules/bundle-dashboard/bundle-dashboard').then(m => m.BundleDashboard),
        canActivate: [permissionGuard([
          EPermission.BUNDLES_VIEW,
          EPermission.BUNDLES_CREATE,
          EPermission.BUNDLES_EDIT,
          EPermission.BUNDLES_DELETE
        ], true)]
      },
      {
        path: 'badges',
        loadComponent: () => import('./dashboard/modules/badge-library/badge-library').then(m => m.BadgeLibrary),
        canActivate: [permissionGuard([EPermission.BADGES_VIEW])]
      },
      {
        path: 'notifications',
        loadComponent: () => import('./notification-center/notification-center').then(m => m.NotificationCenterComponent),
        canActivate: [permissionGuard([EPermission.NOTIFICATIONS_VIEW])]
      },
      {
        path: 'payslips',
        loadComponent: () => import('./dashboard/modules/payslip-dashboard/payslip-dashboard').then(m => m.PayslipDashboard),
        canActivate: [permissionGuard([EPermission.CAN_VIEW_OWN_PAYSLIP])]
      },
      {
        path: 'payslip/:id',
        loadComponent: () => import('./dashboard/modules/payslip-dashboard/components/payslip-viewer/payslip-viewer').then(m => m.PayslipViewer),
        canActivate: [permissionGuard([EPermission.CAN_VIEW_OWN_PAYSLIP, EPermission.CAN_MANAGE_PAYSLIPS], false)]
      },
      {
        path: 'rates',
        loadComponent: () => import('./dashboard/modules/rate-management/rate-management').then(m => m.RateManagementComponent),
        canActivate: [permissionGuard([EPermission.CAN_ADJUST_RATES])]
      },
      {
        path: 'extrawork',
        loadComponent: () => import('./dashboard/modules/extra-work-dashboard/extra-work-dashboard').then(m => m.ExtraWorkDashboard),
        canActivate: [permissionGuard([EPermission.EXTRA_WORK_VIEW])]
      },
      {
        path: 'platform-stats',
        loadComponent: () => import("./dashboard/modules/admin-stats/admin-stats").then(m => m.AdminStatsComponent),
        canActivate: [permissionGuard([EPermission.PLATFORM_STATS_VIEW])]
      }
    ],
    canActivate: [authGuard, profileCompletionGuard, accountStatusGuard]
  },
  {
    path: 'login/callback',
    loadComponent: () => import('./handlers/login-callback/login-callback').then(m => m.LoginCallback)
  },
  {
    path: 'logout',
    loadComponent: () => import('./handlers/logout/logout').then(m => m.Logout)
  },
  {
    path: '**',
    loadComponent: () => import('./shared/components/not-found/not-found').then(m => m.NotFound)
  }
];

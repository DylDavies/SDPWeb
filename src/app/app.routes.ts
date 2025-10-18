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
import { permissionGuard } from './guards/permission-guard';
import { EPermission } from './models/enums/permission.enum';
import { accountStatusGuard } from './guards/account-status-guard';
import { AccountPending } from './status-pages/account-pending/account-pending';
import { AccountDisabled } from './status-pages/account-disabled/account-disabled';
import { UserManagement } from './dashboard/modules/user-management/user-management';
import { BundleDashboard } from './dashboard/modules/bundle-dashboard/bundle-dashboard';
import { BadgeLibrary } from './dashboard/modules/badge-library/badge-library';
import { NotificationCenterComponent } from './notification-center/notification-center';
import { StudentManagement } from './dashboard/modules/student-management/student-management';
import { StudentInformationPage } from './dashboard/modules/student-information/student-information-page/student-information-page';
import { PayslipViewer } from './dashboard/modules/payslip-dashboard/components/payslip-viewer/payslip-viewer';
import { PayslipDashboard } from './dashboard/modules/payslip-dashboard/payslip-dashboard';
import { RateManagementComponent } from './dashboard/modules/rate-management/rate-management';
import { ExtraWorkDashboard } from './dashboard/modules/extra-work-dashboard/extra-work-dashboard';
import { AdminPayslipDashboard } from './dashboard/modules/admin-dashboard/components/admin-payslip-dashboard/admin-payslip-dashboard';
import { AdminStatsComponent } from './dashboard/modules/admin-stats/admin-stats';

export const routes: Routes = [
  { path: '', component: Landing, canActivate: [loginGuard] },
  { path: 'account', canActivate: [authGuard, accountStatusGuard], children: [
    { path: 'pending', component: AccountPending },
    { path: 'disabled', component: AccountDisabled  }
  ] },
  { path: 'dashboard', component: Dashboard, children: [
      { path: '', component: ClientDashboard },
      { path: 'admin', component: AdminDashboard, canActivate: [permissionGuard([EPermission.ADMIN_DASHBOARD_VIEW])] },
      {
        path: 'admin/payslips',
        component: AdminPayslipDashboard,
        canActivate: [permissionGuard([EPermission.CAN_MANAGE_PAYSLIPS])]
      },
      {
        path: 'admin/payslips/:id',
        component: PayslipViewer,
        canActivate: [permissionGuard([EPermission.CAN_MANAGE_PAYSLIPS])]
      },
      { path: 'profile', component: Profile, canActivate: [permissionGuard([EPermission.PROFILE_PAGE_VIEW])] },
      { path: 'profile/:id', component: Profile, canActivate: [permissionGuard([EPermission.VIEW_USER_PROFILE])] },
      { path: 'users', component: UserManagement, canActivate: [permissionGuard([EPermission.USERS_VIEW])] },
      {
        path: 'students',
        component: StudentManagement,
        canActivate: [permissionGuard([EPermission.STUDENTS_VIEW])]
      },
      {
        path: 'student-info/:id',
        component: StudentInformationPage,
        canActivate: [permissionGuard([EPermission.STUDENTS_VIEW])]
      },
      { 
        path: 'bundles', 
        component: BundleDashboard,
        canActivate: [permissionGuard([
          EPermission.BUNDLES_VIEW,
          EPermission.BUNDLES_CREATE,
          EPermission.BUNDLES_EDIT,
          EPermission.BUNDLES_DELETE
        ], true)] 
      },
      { path: 'badges', component: BadgeLibrary, canActivate: [permissionGuard([EPermission.BADGES_VIEW])] },
      {
        path: 'notifications',
        component: NotificationCenterComponent,
        canActivate: [permissionGuard([EPermission.NOTIFICATIONS_VIEW])]
      },
      {
        path: 'payslips',
        component: PayslipDashboard,
        canActivate: [permissionGuard([EPermission.CAN_VIEW_OWN_PAYSLIP])]
      },
      {
        path: 'payslip/:id',
        component: PayslipViewer,
        canActivate: [permissionGuard([EPermission.CAN_VIEW_OWN_PAYSLIP, EPermission.CAN_MANAGE_PAYSLIPS], false)]
      },
      {
        path: 'rates',
        component: RateManagementComponent,
        canActivate: [permissionGuard([EPermission.CAN_ADJUST_RATES])]
      },
      { path: 'extrawork', component: ExtraWorkDashboard, canActivate: [permissionGuard([EPermission.EXTRA_WORK_VIEW])] },
      {
        path: 'platform-stats',
        component: AdminStatsComponent,
        canActivate: [permissionGuard([EPermission.PLATFORM_STATS_VIEW])]
      }
    ],
    canActivate: [authGuard, profileCompletionGuard, accountStatusGuard]
  },
  { path: 'login/callback', component: LoginCallback },
  { path: 'logout', component: Logout },
  { path: '**', component: NotFound }
];
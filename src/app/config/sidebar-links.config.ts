import { EPermission } from '../models/enums/permission.enum';
import { ISidebarItem } from '../models/interfaces/ISidebarItem.interface';

type ISidebarLink = Omit<ISidebarItem, 'children' | 'order' | '_id'>;

export interface ISidebarRemovable {
  stopRemove?: boolean;
}

export type ISidebarLinkDefinition = ISidebarLink & ISidebarRemovable;

export const AVAILABLE_SIDEBAR_LINKS: ISidebarLinkDefinition[] = [
  { label: 'Home', icon: 'dashboard', route: '/dashboard', requiredPermissions: [], stopRemove: true },
  { label: 'Profile', icon: 'person', route: '/dashboard/profile', requiredPermissions: [] },
  { label: 'User Management', icon: 'people', route: '/dashboard/users', requiredPermissions: [EPermission.USERS_VIEW] },
  { label: 'Students', icon: 'school', route: '/dashboard/students'},
  {
    label: 'Bundles',
    icon: 'inventory',
    route: '/dashboard/bundles',
    requiredPermissions: [
      EPermission.BUNDLES_VIEW
    ]
  },
  { label: 'Tutor Matchmaking', icon: 'search', route: '/dashboard/tutor-matchmaking', requiredPermissions: [EPermission.TUTOR_MATCHMAKING_ACCESS] },
  { label: 'Admin', icon: 'shield', route: '/dashboard/admin', requiredPermissions: [EPermission.ADMIN_DASHBOARD_VIEW], stopRemove: true },
  { label: 'Payslips', icon: 'receipt_long', route: '/dashboard/payslips', requiredPermissions: [EPermission.CAN_VIEW_OWN_PAYSLIP] },
  { label: 'Rate Management', icon: 'price_change', route: '/dashboard/rates', requiredPermissions: [EPermission.CAN_ADJUST_RATES] },
  { label: 'Extra Work', icon: 'work', route: '/dashboard/extrawork', requiredPermissions: [EPermission.EXTRA_WORK_VIEW] },
  { label: 'Payslip Management', icon: 'request_quote', route: '/dashboard/admin/payslips', requiredPermissions: [EPermission.CAN_MANAGE_PAYSLIPS] },
  { label: 'Platform Stats', icon: 'analytics', route: '/dashboard/platform-stats', requiredPermissions: [EPermission.PLATFORM_STATS_VIEW] },
];
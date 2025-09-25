export enum EPermission {
    // Role Management Permissions
    ROLES_CREATE = 'roles:create',
    ROLES_VIEW = 'roles:view',
    ROLES_EDIT = 'roles:edit',
    ROLES_DELETE = 'roles:delete',

    // User Management Permissions
    USERS_VIEW = 'users:view',
    USERS_MANAGE_ROLES = 'users:manage_roles', // Assign/remove roles from users
    USERS_EDIT = 'users:edit',
    USERS_DELETE = 'users:delete',
    VIEW_USER_PROFILE = 'users:view_profile',

    // Page/Feature Access Permissions
    DASHBOARD_VIEW = 'dashboard:view',
    ADMIN_DASHBOARD_VIEW = 'admin_dashboard:view',
    PROFILE_PAGE_VIEW = 'profile_page:view',
  
    //Leave Management Permissions
    LEAVE_MANAGE = "leave:manage",

    // Proficiency Management Permissions
    PROFICIENCIES_MANAGE = 'proficiencies:manage',

    // Bundle Management Permissions
    BUNDLES_CREATE = 'bundles:create',
    BUNDLES_VIEW = 'bundles:view',
    BUNDLES_EDIT = 'bundles:edit',
    BUNDLES_DELETE = 'bundles:delete',
    BUNDLES_APPROVE = 'bundles:approve',

    EXTRA_WORK_CREATE = 'extra_work:create',
    EXTRA_WORK_VIEW = 'extra_work:view',
    EXTRA_WORK_VIEW_ALL = 'extra_work:view_all',
    EXTRA_WORK_EDIT = 'extra_work:edit',
    EXTRA_WORK_APPROVE = 'extra_work:approve',

    // Sidebar Management
    SIDEBAR_MANAGE = 'sidebar:manage',

    // Badge Management Permissions
    BADGES_CREATE = 'badges:create',
    BADGES_MANAGE = 'badges:manage',
    BADGES_VIEW = 'badges:view',
    BADGES_VIEW_REQUIREMENTS = 'badges:view_requirements', 
    BADGES_MANAGE_REQUIREMENTS = 'badges:manage_requirements',

    NOTIFICATIONS_VIEW = 'notifications:view',


    // Remark Management Permissions
    REMARKS_MANAGE = 'remarks:manage'
}
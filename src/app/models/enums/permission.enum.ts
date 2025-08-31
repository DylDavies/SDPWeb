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
    LEAVE_MANAGE = "leave:manage"
}

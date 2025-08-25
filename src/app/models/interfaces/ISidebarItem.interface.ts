import { EPermission } from "../enums/permission.enum";

export interface ISidebarItem{
    label: string;
    icon: string;
    route: string;
    requiredPermissions?: EPermission[]
}
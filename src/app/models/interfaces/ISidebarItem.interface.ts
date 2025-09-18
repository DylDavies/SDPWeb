import { EPermission } from "../enums/permission.enum";

export interface ISidebarItem{
    _id?: string;
    label: string;
    icon: string;
    route?: string;
    requiredPermissions?: EPermission[];

    order: number;
    children?: ISidebarItem[]
}
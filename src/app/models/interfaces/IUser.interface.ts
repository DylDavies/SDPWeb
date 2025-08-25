import { RoleNode } from "../../services/role-service";
import { EPermission } from "../enums/permission.enum";
import { EUserType } from "../enums/user-type.enum";

export interface IUser {
    _id: string;
    googleId: string;
    email: string;
    displayName: string;
    picture?: string;
    firstLogin: boolean;
    createdAt: Date;
    roles: RoleNode[];
    type: EUserType;
    permissions: EPermission[],
    pending: boolean,
    disabled: boolean
}
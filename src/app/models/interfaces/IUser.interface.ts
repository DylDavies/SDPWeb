import { RoleNode } from "../../services/role-service";
import { Theme } from "../../services/theme-service";
import { EPermission } from "../enums/permission.enum";
import { EUserType } from "../enums/user-type.enum";
import IBadge from "./IBadge.interface";
import { ILeave } from "./ILeave.interface";
import { IProficiency } from "./IProficiency.interface";

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
    disabled: boolean,
    theme: Theme,
    leave: ILeave[],
    proficiencies?: IProficiency[],
    availability?: number,
    badges?: IBadge[],
}
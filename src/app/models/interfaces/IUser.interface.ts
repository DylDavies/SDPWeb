import { RoleNode } from "../../services/role-service";
import { Theme } from "../../services/theme-service";
import { EPermission } from "../enums/permission.enum";
import { EUserType } from "../enums/user-type.enum";
import IBadge from "./IBadge.interface";
import { ILeave } from "./ILeave.interface";
import { IProficiency } from "./IProficiency.interface";
import { IAddress } from "./IAddress.interface";

export interface IRateAdjustment {
    reason: string;
    newRate: number;
    effectiveDate: Date;
    approvingManagerId: string;
}

export interface IUserBadge{
    badge: IBadge;
    dateAdded: string;
}

export interface IUser {
    _id: string;
    googleId: string;
    email: string;
    displayName: string;
    picture?: string;
    address?: IAddress;
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
    badges?: IUserBadge[],
    paymentType: 'Contract' | 'Salaried';
    monthlyMinimum: number;
    rateAdjustments: IRateAdjustment[];
}
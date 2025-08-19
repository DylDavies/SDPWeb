import { EUserRole } from "../enums/user-role.enum";

export interface IUser {
    id: string,
    email: string,
    displayName: string,
    role: EUserRole,
    picture: string,
    createdAt: Date,
    firstLogin: boolean
}
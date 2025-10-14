import { EMissionStatus } from "../enums/mission-status.enum";
import { IPopulatedUser } from "./IBundle.interface";
import { IDocument } from "./IDocument.interface";

export interface IMissions {
    _id: string;
    bundleId: string;
    document: IDocument; // Changed from documentPath and documentName
    student: string | IPopulatedUser;
    tutor: string | IPopulatedUser;
    createdAt: Date;
    remuneration: number;
    commissionedBy: string | IPopulatedUser;
    hoursCompleted: number;
    dateCompleted: Date;
    status: EMissionStatus;
    updatedAt: Date;
}
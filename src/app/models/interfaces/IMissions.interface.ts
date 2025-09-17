
import { EMissionStatus } from "../enums/mission-status.enum";

export interface IPopulatedStudent {
  _id: string;
  displayName: string;
};

export interface IMissions{
    _id: string;
    document: string;
    student: string | IPopulatedStudent; // The ID of the student this bundle is for, or the populated student object
    tutor: string;
    createdAt: Date;
    remuneration: number;
    commissionedBy: string | IPopulatedStudent;
    hoursCompleted: number;
    dateCompleted: Date;
    status: EMissionStatus;
    updatedAt: Date; // Automatically managed by timestamps
}
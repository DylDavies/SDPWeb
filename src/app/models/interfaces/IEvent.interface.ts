import { IPopulatedUser } from "./IBundle.interface";

export interface IEvent {
    _id: string;
    bundle: string;
    student: IPopulatedUser;
    tutor: IPopulatedUser;
    subject: string;
    startTime: Date;
    duration: number; // Duration in minutes
    remarked: boolean;
    remark: string; // This will be the ID of the remark
    rating?: number;
}
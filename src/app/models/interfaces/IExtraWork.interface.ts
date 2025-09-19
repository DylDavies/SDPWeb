import { IPopulatedUser } from "./IBundle.interface";

export enum EExtraWorkStatus {
    InProgress = 'In Progress',
    Completed = 'Completed',
    Approved = 'Approved',
    Denied = 'Denied' // Added the new Denied status
}

export interface IExtraWork {
  _id: string;
  userId: string | IPopulatedUser;
  studentId: string | IPopulatedUser;
  commissionerId: string | IPopulatedUser;
  workType: string;
  details: string;
  remuneration: number;
  dateCompleted: Date | null;
  status: EExtraWorkStatus;
  createdAt: Date;
  updatedAt: Date;
}
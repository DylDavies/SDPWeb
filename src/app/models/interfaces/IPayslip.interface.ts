import { EPayslipStatus } from "../enums/payslip-status.enum";

export interface IPayslip {
    _id: string;
    userId: string;
    payPeriod: string;
    status: EPayslipStatus;
    earnings: IEarning[];
    miscEarnings: IMiscEarning[];
    bonuses: IBonus[];
    deductions: IDeduction[];
    grossEarnings: number;
    totalDeductions: number;
    netPay: number;
    uif: number;
    paye: number;
    notes: INote[];
    history: IHistory[];

    // Extended properties for display
    lessonsCompleted?: ILessonCompleted[];
    lessonsTaughtToClass?: ILessonTaughtToClass[];
    pibBonuses?: IPIBBonus[];
    miscBonuses?: IMiscBonus[];
}

export interface IAddress {
    street: string;
    suburb: string;
    city: string;
    postalCode: string;
}

export interface ILessonCompleted {
    number: number;
    student: string;
    subject: string;
    date: string;
    baseRate: number;
    badgeBonus: number;
    durations: number;
    hourlyRate: number;
}

export interface ILessonTaughtToClass {
    number: number;
    student: string;
    hours: number;
    rate: number;
    total: number;
}

export interface IPIBBonus {
    number: number;
    description: string;
    value: number;
}

export interface IMiscBonus {
    number: number;
    description: string;
    value: number;
}

export interface IBonus {
    description: string;
    amount: number;
}

export interface IPreapprovedBonus {
    id: string;
    description: string;
    amount: number;
    category: string;
}

export interface IDeduction {
    description: string;
    amount: number;
}

export interface IMiscEarning {
    description: string;
    amount: number;
}

// Keep legacy interfaces for backward compatibility
export interface IEarning {
    description: string;
    baseRate: number;
    hours: number;
    rate: number;
    total: number;
    date: string;
}

export interface INote {
    _id?: string;
    itemId: string;
    note: string;
    resolved: boolean;
    resolutionNote?: string;
}

export interface IHistory {
    status: string;
    timestamp: Date;
    updatedBy: string;
}
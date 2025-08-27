import { IGrade } from "./IGrade.interface";

export interface ISubject{
    name: string;
    grades: IGrade[];
    _id?: string;
}
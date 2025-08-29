import { ISubject } from "./ISubject.interface";

export interface IProficiency {
    name: string;
    subjects: Record<string, ISubject>;
}
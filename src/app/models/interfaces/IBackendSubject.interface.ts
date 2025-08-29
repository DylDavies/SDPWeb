import { ISubject } from "./ISubject.interface";

export interface BackendSubject extends ISubject {
  grades: string[];
}
import { ISubject } from "./ISubject.interface";

export interface BackendSubject extends ISubject {
  grade?: string | string[];
}


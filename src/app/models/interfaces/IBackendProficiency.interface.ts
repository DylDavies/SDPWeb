import { BackendSubject } from "./IBackendSubject.interface";

export interface IBackendProficiency {
  name: string;
  subjects: Record<string, BackendSubject>;
}
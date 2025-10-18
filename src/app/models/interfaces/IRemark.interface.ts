import { IDocument } from './IDocument.interface';

export type RemarkFieldType = 'string' | 'boolean' | 'number' | 'time' | 'pdf' | 'image' | 'audio';


export interface IRemarkField {
    name: string;
    type: RemarkFieldType;
}

export interface IRemark {
    _id: string;
    event: string;
    template: IRemarkTemplate;
    remarkedAt: Date;
    entries: {
        field: string;
        value: string | number | boolean | Date | IDocument | null;
    }[];
}

export interface IRemarkTemplate {
    _id: string;
    name: string;
    fields: IRemarkField[];
    isActive: boolean;
}

export type { IDocument };


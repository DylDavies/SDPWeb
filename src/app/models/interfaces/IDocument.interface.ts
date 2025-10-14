import { IPopulatedUser } from "./IBundle.interface";

export interface IDocument {
    _id: string;
    fileKey: string;
    originalFilename: string;
    contentType: string;
    uploadedBy: string | IPopulatedUser;
    createdAt: Date;
}
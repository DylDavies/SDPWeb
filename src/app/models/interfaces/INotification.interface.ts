export interface INotification {
    _id: string;
    recipientId: string;
    title: string;
    message: string;
    read: boolean;
    createdAt: Date;
    deletedAt?: Date;
}

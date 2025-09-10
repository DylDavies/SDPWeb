export default interface IBadge{
    _id: string;
    name: string;
    image: string;
    TLA: string;
    summary: string;
    description: string;
    permanent: boolean;
    expirationDate?: Date;
    bonus: number;
}
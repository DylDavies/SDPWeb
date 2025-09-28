import { EItemType } from "../enums/item-type.enum";

export interface IPreapprovedItem {
    _id: string;
    itemName: string;
    itemType: EItemType;
    defaultAmount: number;
    isAdminOnly: boolean;
}
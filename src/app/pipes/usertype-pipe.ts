import { Pipe, PipeTransform } from '@angular/core';
import { EUserType } from '../models/enums/user-type.enum';

@Pipe({
  name: 'userTypePipe'
})
export class UserTypePipe implements PipeTransform {

  transform(value: EUserType | undefined): unknown {
    switch (value) {
      case EUserType.Client:
        return "Client";
      case EUserType.Staff:
        return "Staff";
      case EUserType.Admin:
        return "Administrator";
      default:
        return ""
    }
  }

}

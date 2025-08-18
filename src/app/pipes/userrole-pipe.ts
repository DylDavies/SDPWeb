import { Pipe, PipeTransform } from '@angular/core';
import { EUserRole } from '../models/enums/user-role.enum';

@Pipe({
  name: 'userrole'
})
export class UserRolePipe implements PipeTransform {

  transform(value: EUserRole | undefined, ...args: unknown[]): unknown {
    switch (value) {
      case EUserRole.User:
        return "Tutor";
      case EUserRole.Admin:
        return "Administrator";
      default:
        return ""
    }
  }

}

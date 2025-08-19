import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'displayNamePipe'
})
export class DisplayNamePipe implements PipeTransform {

  transform(value: string): unknown {

    if (value.length > 25) return value.substring(0, 25) + "...";

    return value;
  }

}

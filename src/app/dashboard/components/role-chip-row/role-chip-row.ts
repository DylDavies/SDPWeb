import { Component, Input } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { RoleNode } from '../../../services/role-service';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-role-chip-row',
  imports: [MatChipsModule, MatTooltipModule],
  templateUrl: './role-chip-row.html',
  styleUrl: './role-chip-row.scss'
})
export class RoleChipRow {
  @Input() roles: RoleNode[] = [];

  public visibleRolesLimit = 3;

  /**
   * Generates a tooltip string for roles that are not immediately visible.
   * @param roles The full array of a user's roles.
   * @returns A string with each hidden role name on a new line.
   */
  getRemainingRolesTooltip(roles: RoleNode[]): string {
    if (roles.length <= this.visibleRolesLimit) {
      return '';
    }
    // Slice the array to get the roles that are hidden and join their names.
    return roles.slice(this.visibleRolesLimit).map(role => role.name).join('\n');
  }

  getContrastColor(hexColor: string | undefined): 'white' | 'black' {
    if (!hexColor) return 'black';
    const r = parseInt(hexColor.substr(1, 2), 16);
    const g = parseInt(hexColor.substr(3, 2), 16);
    const b = parseInt(hexColor.substr(5, 2), 16);
    const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
    return (yiq >= 128) ? 'black' : 'white';
}
}

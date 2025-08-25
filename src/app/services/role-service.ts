import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { EPermission } from '../models/enums/permission.enum';

export interface RoleNode {
    _id: string;
    name: string;
    permissions: EPermission[];
    parent: string | null;
    children: RoleNode[];
    color: string;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private httpService = inject(HttpService);

  /**
   * Fetches the entire role hierarchy from the API.
   * @returns An observable containing the tree structure of roles.
   */
  getRoleTree(): Observable<RoleNode> {
    return this.httpService.get<RoleNode>('roles');
  }

  /**
   * Creates a new role.
   * @param roleData The data for the new role.
   * @returns An observable of the newly created role.
   */
  createRole(roleData: { name: string; permissions: EPermission[]; parent: string | null }): Observable<RoleNode> {
    return this.httpService.post('roles', roleData);
  }

  /**
   * Creates a new role.
   * @param roleData The data for the new role.
   * @returns An observable of the newly created role.
   */
  updateRole(roleData: RoleNode): Observable<RoleNode> {
    return this.httpService.patch('roles', roleData);
  }

  /**
   * Deletes a role by its ID.
   * @param roleId The ID of the role to delete.
   * @returns An observable of the API response.
   */
  deleteRole(roleId: string): Observable<{message: string}> {
    return this.httpService.delete(`roles/${roleId}`);
  }
}

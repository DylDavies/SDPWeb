import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { EPermission } from '../models/enums/permission.enum';

// This interface should match the RoleNode type on your backend
export interface RoleNode {
    _id: string;
    name: string;
    permissions: EPermission[];
    parent: string | null;
    children: RoleNode[];
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
  getRoleTree(): Observable<RoleNode[]> {
    return this.httpService.get<RoleNode[]>('roles');
  }

  /**
   * Creates a new role.
   * @param roleData The data for the new role.
   * @returns An observable of the newly created role.
   */
  createRole(roleData: { name: string; permissions: EPermission[]; parent: string | null }): Observable<any> {
    return this.httpService.post('roles', roleData);
  }

  /**
   * Deletes a role by its ID.
   * @param roleId The ID of the role to delete.
   * @returns An observable of the API response.
   */
  deleteRole(roleId: string): Observable<any> {
    return this.httpService.delete(`roles/${roleId}`);
  }
}

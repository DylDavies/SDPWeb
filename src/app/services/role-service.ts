import { inject, Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap } from 'rxjs';
import { HttpService } from './http-service';
import { EPermission } from '../models/enums/permission.enum';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

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
  private socketService = inject(SocketService);

  private roleTree$ = new BehaviorSubject<RoleNode | null>(null);

  /**
   * A public observable that components can subscribe to for the role tree.
   */
  public allRoles$ = this.roleTree$.asObservable();

  constructor() {
    this.socketService.listen<unknown>(ESocketMessage.RolesUpdated).subscribe(() => {
      console.log('Received roles-updated event. Refreshing role tree.');
      this.getRoleTree().subscribe();
    });
  }

  /**
   * Fetches the entire role hierarchy from the API and updates the state.
   */
  getRoleTree(): Observable<RoleNode> {
    return this.httpService.get<RoleNode>('roles').pipe(
      tap(rootNode => this.roleTree$.next(rootNode))
    );
  }

  /**
   * Creates a new role and then triggers a refresh of the role tree.
   */
  createRole(roleData: { name: string; permissions: EPermission[]; parent: string | null }): Observable<RoleNode> {
    return this.httpService.post<RoleNode>('roles', roleData).pipe(
      tap(() => this.getRoleTree().subscribe())
    );
  }

  /**
   * Updates an existing role and then triggers a refresh of the role tree.
   */
  updateRole(roleData: RoleNode): Observable<RoleNode> {
    return this.httpService.patch<RoleNode>('roles', roleData).pipe(
      tap(() => this.getRoleTree().subscribe())
    );
  }

  /**
   * Deletes a role by its ID and then triggers a refresh of the role tree.
   */
  deleteRole(roleId: string): Observable<{message: string}> {
    return this.httpService.delete<{message: string}>(`roles/${roleId}`).pipe(
      tap(() => this.getRoleTree().subscribe())
    );
  }
}

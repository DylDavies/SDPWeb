import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { RoleService, RoleNode } from './role-service';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { CustomObservableService } from './custom-observable-service';
import { EPermission } from '../models/enums/permission.enum';
import { ESocketMessage } from '../models/enums/socket-message.enum';

describe('RoleService', () => {
  let service: RoleService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;
  let observableServiceSpy: jasmine.SpyObj<CustomObservableService>;

  const mockRoleNode: RoleNode = {
    _id: 'root',
    name: 'Root',
    permissions: [EPermission.DASHBOARD_VIEW],
    parent: null,
    color: '#000000',
    children: [
      {
        _id: 'admin',
        name: 'Admin',
        permissions: [EPermission.ROLES_CREATE, EPermission.ROLES_EDIT],
        parent: 'root',
        color: '#ff0000',
        children: []
      }
    ]
  };

  beforeEach(() => {
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen', 'isSocketConnected', 'connectionHook']);
    socketSpy.isSocketConnected.and.returnValue(true);
    socketSpy.connectionHook.and.callFake((cb: () => void) => cb());
    const observableSpy = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);

    // IMPORTANT: Set up httpSpy.get BEFORE injecting the service
    // The constructor's socket listener calls getRoleTree() which needs httpService.get
    httpSpy.get.and.returnValue(of(mockRoleNode));
    socketSpy.listen.and.returnValue(of({}));
    observableSpy.createManagedTopicObservable.and.returnValue(of(mockRoleNode));

    TestBed.configureTestingModule({
      providers: [
        RoleService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy },
        { provide: CustomObservableService, useValue: observableSpy }
      ]
    });

    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;
    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    observableServiceSpy = TestBed.inject(CustomObservableService) as jasmine.SpyObj<CustomObservableService>;
    service = TestBed.inject(RoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should listen to roles-updated socket events in constructor', () => {
    expect(socketServiceSpy.listen).toHaveBeenCalledWith(ESocketMessage.RolesUpdated);
  });

  it('should create managed topic observable in constructor', () => {
    expect(observableServiceSpy.createManagedTopicObservable).toHaveBeenCalledWith(
      ESocketMessage.RolesUpdated,
      jasmine.any(Object),
      jasmine.any(Function)
    );
  });

  describe('getRoleTree', () => {
    it('should fetch role tree from API', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.getRoleTree().subscribe((roleTree) => {
        expect(roleTree).toEqual(mockRoleNode);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('roles');
        done();
      });
    });

    it('should update roleTree$ BehaviorSubject when fetching', (done) => {
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.getRoleTree().subscribe(() => {
        service.allRoles$.subscribe((tree) => {
          expect(tree).toBeTruthy();
          done();
        });
      });
    });
  });

  describe('createRole', () => {
    it('should create a new role', (done) => {
      const newRole = {
        name: 'New Role',
        permissions: [EPermission.DASHBOARD_VIEW],
        parent: 'root'
      };
      const createdRole: RoleNode = {
        _id: 'new-role-123',
        ...newRole,
        color: '#00ff00',
        children: []
      };

      httpServiceSpy.post.and.returnValue(of(createdRole));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.createRole(newRole).subscribe((role) => {
        expect(role).toEqual(createdRole);
        expect(httpServiceSpy.post).toHaveBeenCalledWith('roles', newRole);
        done();
      });
    });

    it('should refresh role tree after creating role', (done) => {
      const newRole = {
        name: 'Test Role',
        permissions: [],
        parent: null
      };

      httpServiceSpy.post.and.returnValue(of(mockRoleNode));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.createRole(newRole).subscribe(() => {
        expect(httpServiceSpy.get).toHaveBeenCalledWith('roles');
        done();
      });
    });
  });

  describe('updateRole', () => {
    it('should update an existing role', (done) => {
      const updatedRole: RoleNode = {
        ...mockRoleNode,
        name: 'Updated Root'
      };

      httpServiceSpy.patch.and.returnValue(of(updatedRole));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.updateRole(updatedRole).subscribe((role) => {
        expect(role).toEqual(updatedRole);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith('roles', updatedRole);
        done();
      });
    });

    it('should refresh role tree after updating role', (done) => {
      httpServiceSpy.patch.and.returnValue(of(mockRoleNode));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.updateRole(mockRoleNode).subscribe(() => {
        expect(httpServiceSpy.get).toHaveBeenCalledWith('roles');
        done();
      });
    });
  });

  describe('updateRoleParent', () => {
    it('should update the parent of a role', (done) => {
      const roleId = 'admin';
      const newParentId = 'super-admin';
      const updatedRole: RoleNode = {
        ...mockRoleNode.children[0],
        parent: newParentId
      };

      httpServiceSpy.patch.and.returnValue(of(updatedRole));

      service.updateRoleParent(roleId, newParentId).subscribe((role) => {
        expect(role.parent).toBe(newParentId);
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `roles/${roleId}/parent`,
          { newParentId }
        );
        done();
      });
    });

    it('should handle moving role to root (null parent)', (done) => {
      const roleId = 'admin';
      const newParentId = 'root';

      httpServiceSpy.patch.and.returnValue(of(mockRoleNode.children[0]));

      service.updateRoleParent(roleId, newParentId).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledWith(
          `roles/${roleId}/parent`,
          { newParentId }
        );
        done();
      });
    });
  });

  describe('deleteRole', () => {
    it('should delete a role by ID', (done) => {
      const roleId = 'admin';
      const response = { message: 'Role deleted successfully' };

      httpServiceSpy.delete.and.returnValue(of(response));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.deleteRole(roleId).subscribe((result) => {
        expect(result).toEqual(response);
        expect(httpServiceSpy.delete).toHaveBeenCalledWith(`roles/${roleId}`);
        done();
      });
    });

    it('should refresh role tree after deleting role', (done) => {
      const roleId = 'admin';

      httpServiceSpy.delete.and.returnValue(of({ message: 'Deleted' }));
      httpServiceSpy.get.and.returnValue(of(mockRoleNode));

      service.deleteRole(roleId).subscribe(() => {
        expect(httpServiceSpy.get).toHaveBeenCalledWith('roles');
        done();
      });
    });
  });
});

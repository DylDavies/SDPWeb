import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { UserService } from './user-service';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';
import { ELeave } from '../models/enums/ELeave.enum';
import { IBackendProficiency } from '../models/interfaces/IBackendProficiency.interface';

const mockUsers: IUser[] = [
  {
    _id: '1',
    googleId: 'google1',
    email: 'test1@test.com',
    displayName: 'Test User 1',
    type: EUserType.Staff,
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: false,
    disabled: false,
    leave: []
  },
  {
    _id: '2',
    googleId: 'google2',
    email: 'test2@test.com',
    displayName: 'Test User 2',
    type: EUserType.Client,
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: true,
    disabled: true,
    leave: []
  },
];


describe('UserService', () => {
  let service: UserService;
  let httpServiceSpy: jasmine.SpyObj<HttpService>;
  let socketServiceSpy: jasmine.SpyObj<SocketService>;

  beforeEach(() => {
    // Create spy objects for the services
    const httpSpy = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
    const socketSpy = jasmine.createSpyObj('SocketService', ['listen']);

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: HttpService, useValue: httpSpy },
        { provide: SocketService, useValue: socketSpy }
      ]
    });

    socketServiceSpy = TestBed.inject(SocketService) as jasmine.SpyObj<SocketService>;
    httpServiceSpy = TestBed.inject(HttpService) as jasmine.SpyObj<HttpService>;

    socketServiceSpy.listen.and.returnValue(of(null));
    httpServiceSpy.get.and.returnValue(of([])); // Default to returning an empty array

    service = TestBed.inject(UserService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('fetchAllUsers', () => {
    it('should fetch all users via GET and update the users$ subject', (done: DoneFn) => {
      // Override the default 'get' spy for this specific test
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.fetchAllUsers().subscribe(users => {
        expect(users).toEqual(mockUsers);
        service.allUsers$.subscribe(usersFromStream => {
          expect(usersFromStream).toEqual(mockUsers);
          done();
        });
      });

      expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
    });
  });

  describe('getUser', () => {
    it('should fetch the current user via GET', () => {
      const mockUser = mockUsers[0];
      httpServiceSpy.get.and.returnValue(of(mockUser));
      service.getUser().subscribe(user => {
        expect(user).toEqual(mockUser);
      });
      expect(httpServiceSpy.get).toHaveBeenCalledWith('user');
    });
  });

  describe('updateProfile', () => {
    it('should send a PATCH request to update the user profile', () => {
      const updatedData = { displayName: 'Updated Name' };
      httpServiceSpy.patch.and.returnValue(of({ ...mockUsers[0], ...updatedData }));
      service.updateProfile(updatedData).subscribe(user => {
        expect(user.displayName).toBe('Updated Name');
      });
      expect(httpServiceSpy.patch).toHaveBeenCalledOnceWith('user', updatedData);
    });
  });

  describe('assignRoleToUser', () => {
     it('should assign a role and refresh the user list', (done: DoneFn) => {
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.assignRoleToUser('1', 'role1').subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/roles', { roleId: 'role1' });
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('removeRoleFromUser', () => {
     it('should remove a role and refresh the user list', (done: DoneFn) => {
      httpServiceSpy.delete.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.removeRoleFromUser('1', 'role1').subscribe(() => {
        expect(httpServiceSpy.delete).toHaveBeenCalledOnceWith('users/1/roles/role1');
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('requestLeave', () => {
    it('should submit a leave request and refresh the user list', (done: DoneFn) => {
      const leaveData = { reason: 'Vacation', startDate: new Date(), endDate: new Date() };
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.requestLeave('1', leaveData).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/leave', leaveData);
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });
  
  describe('updateLeaveStatus', () => {
    it('should update leave status and refresh the user list', (done: DoneFn) => {
      const status = ELeave.Approved;
      httpServiceSpy.patch.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.updateLeaveStatus('1', 'leave1', status).subscribe(() => {
        expect(httpServiceSpy.patch).toHaveBeenCalledOnceWith('users/1/leave/leave1', { approved: status });
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('approveUser', () => {
    it('should approve a user and refresh the user list', (done: DoneFn) => {
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.approveUser('1').subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/approve', {});
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('disableUser', () => {
    it('should disable a user and refresh the user list', (done: DoneFn) => {
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.disableUser('1').subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/disable', {});
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('enableUser', () => {
    it('should enable a user and refresh the user list', (done: DoneFn) => {
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.enableUser('1').subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/enable', {});
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('updateUserType', () => {
    it('should update user type and refresh the user list', (done: DoneFn) => {
      const type = EUserType.Admin;
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.updateUserType('1', type).subscribe(() => {
        expect(httpServiceSpy.post).toHaveBeenCalledOnceWith('users/1/type', { type });
        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('getUserById', () => {
    it('should return a user from the cache if available', (done: DoneFn) => {
      service['users$'].next(mockUsers); // Prime the cache

      httpServiceSpy.get.calls.reset();

      service.getUserById('1').subscribe(user => {
        expect(user).toEqual(mockUsers[0]);
        expect(httpServiceSpy.get).not.toHaveBeenCalled(); // Should not call http.get
        done();
      });
    });

    it('should fetch all users if the user is not in the cache', (done: DoneFn) => {
      service['users$'].next([]); // Ensure cache is empty
      httpServiceSpy.get.and.returnValue(of(mockUsers));

      service.getUserById('1').subscribe(user => {
        expect(user).toEqual(mockUsers[0]);

        expect(httpServiceSpy.get).toHaveBeenCalledWith('users');
        done();
      });
    });
  });

  describe('updateUserProficiency', () => {
    it('should update user proficiency without refreshing the list', () => {
      const userId = '1';
      const proficiencyData: IBackendProficiency = { name: 'Math', subjects: {} };
      httpServiceSpy.post.and.returnValue(of(mockUsers[0]));
      httpServiceSpy.get.calls.reset();

      service.updateUserProficiency(userId, proficiencyData).subscribe(user => {
        expect(user).toEqual(mockUsers[0]);
      });

      expect(httpServiceSpy.post).toHaveBeenCalledOnceWith(`users/${userId}/proficiencies`, proficiencyData);
      expect(httpServiceSpy.get).not.toHaveBeenCalled();
    });
  });

  describe('deleteSubjectFromProficiency', () => {
    it("should delete a subject from a user's proficiency", () => {
      const userId = '1';
      const profName = 'Math';
      const subjectId = 'algebra';
      httpServiceSpy.delete.and.returnValue(of(mockUsers[0]));

      service.deleteSubjectFromProficiency(userId, profName, subjectId).subscribe(user => {
        expect(user).toEqual(mockUsers[0]);
      });

      expect(httpServiceSpy.delete).toHaveBeenCalledOnceWith(`users/${userId}/proficiencies/${profName}/subjects/${subjectId}`);
    });
  });
});
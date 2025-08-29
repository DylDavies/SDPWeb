import { TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { AuthService } from '../services/auth-service';
import { accountStatusGuard } from './account-status-guard';
import { IUser } from '../models/interfaces/IUser.interface';
import { EUserType } from '../models/enums/user-type.enum';

// --- Mock Data ---
const activeUser: IUser = {
  _id: '1', displayName: 'Active User', email: 'active@test.com',
  pending: false, disabled: false, type: EUserType.Staff, roles: [], permissions: [],
  picture: '', createdAt: new Date(), firstLogin: false, googleId: '', theme: 'system', leave: []
};

const pendingUser: IUser = { ...activeUser, _id: '2', pending: true };
const disabledUser: IUser = { ...activeUser, _id: '3', disabled: true };

// --- Mock Services ---
const mockAuthService = {
  // We will change this observable in each test
  verifyCurrentUser: () => of<IUser | null>(null)
};

const mockRouter = {
  createUrlTree: (commands: any[]) => new UrlTree() // A simple mock for UrlTree
};

describe('accountStatusGuard', () => {
  // Helper function to run the guard within an injection context
  const executeGuard = (url: string): Observable<boolean | UrlTree> => {
    const route: any = { snapshot: {} };
    const state: any = { url };
    return TestBed.runInInjectionContext(() => accountStatusGuard(route, state)) as Observable<boolean>;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: Router, useValue: mockRouter }
      ]
    });
  });

  it('should allow navigation for an active user trying to access a normal page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(activeUser));
    let result: boolean | UrlTree = false;

    executeGuard('/dashboard').subscribe(res => result = res);
    tick(); // Complete the observable

    expect(result).toBe(true);
  }));

  it('should redirect an active user away from a status page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(activeUser));
    spyOn(mockRouter, 'createUrlTree').and.callThrough();
    let result: boolean | UrlTree = false;

    executeGuard('/account/pending').subscribe(res => result = res);
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/dashboard']);
  }));

  it('should redirect a pending user to the pending page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(pendingUser));
    spyOn(mockRouter, 'createUrlTree').and.callThrough();
    let result: boolean | UrlTree = false;

    executeGuard('/dashboard').subscribe(res => result = res);
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/account/pending']);
  }));

  it('should ALLOW a pending user to access the pending page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(pendingUser));
    let result: boolean | UrlTree = false;

    executeGuard('/account/pending').subscribe(res => result = res);
    tick();

    expect(result).toBe(true);
  }));

  it('should redirect a disabled user to the disabled page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(disabledUser));
    spyOn(mockRouter, 'createUrlTree').and.callThrough();
    let result: boolean | UrlTree = false;

    executeGuard('/dashboard').subscribe(res => result = res);
    tick();

    expect(result).toBeInstanceOf(UrlTree);
    expect(mockRouter.createUrlTree).toHaveBeenCalledWith(['/account/disabled']);
  }));

  it('should ALLOW a disabled user to access the disabled page', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(disabledUser));
    let result: boolean | UrlTree = false;

    executeGuard('/account/disabled').subscribe(res => result = res);
    tick();

    expect(result).toBe(true);
  }));

  it('should allow navigation if there is no user (delegates to authGuard)', fakeAsync(() => {
    spyOn(mockAuthService, 'verifyCurrentUser').and.returnValue(of(null));
    let result: boolean | UrlTree = false;

    executeGuard('/dashboard').subscribe(res => result = res);
    tick();

    expect(result).toBe(true);
  }));
});

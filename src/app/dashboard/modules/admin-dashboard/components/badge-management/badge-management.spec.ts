import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { PLATFORM_ID } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { BadgeManagement } from './badge-management';
import { BadgeService } from '../../../../../services/badge-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { SocketService } from '../../../../../services/socket-service';
import { CustomObservableService } from '../../../../../services/custom-observable-service';
import { HttpService } from '../../../../../services/http-service';
import { UserService } from '../../../../../services/user-service';
import { AuthService } from '../../../../../services/auth-service';
import IBadge from '../../../../../models/interfaces/IBadge.interface';
import { CreateEditBadgeDialogComponent } from '../create-edit-badge-dialog/create-edit-badge-dialog';

// --- MOCK DATA ---
const mockBadges: IBadge[] = [
  { _id: '1', name: 'Badge One', TLA: 'BOE', image: 'star', summary: 's1', description: 'd1', permanent: true, bonus: 10 },
  { _id: '2', name: 'Badge Two', TLA: 'BTO', image: 'emoji_events', summary: 's2', description: 'd2', permanent: false, bonus: 5 }
];

describe('BadgeManagement', () => {
  let component: BadgeManagement;
  let fixture: ComponentFixture<BadgeManagement>;
  let mockBadgeService: jasmine.SpyObj<BadgeService>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  beforeEach(async () => {
    mockBadgeService = jasmine.createSpyObj('BadgeService', ['getBadges'], {
      allBadges$: of(mockBadges)
    });
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);

    const mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'subscribe', 'listen', 'connectionHook', 'isSocketConnected']);
    mockSocketService.isSocketConnected.and.returnValue(false);
    const mockCustomObservableService = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);
    const mockHttpService = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
    const mockUserService = jasmine.createSpyObj('UserService', ['fetchAllUsers'], { allUsers$: of([]) });
    const mockAuthService = jasmine.createSpyObj('AuthService', ['verifyCurrentUser', 'hasPermission'], { currentUser$: of(null) });
    mockAuthService.hasPermission.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [BadgeManagement, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BadgeService, useValue: mockBadgeService },
        { provide: SnackBarService, useValue: mockSnackbarService },
        { provide: MatDialog, useValue: mockDialog },
        { provide: SocketService, useValue: mockSocketService },
        { provide: CustomObservableService, useValue: mockCustomObservableService },
        { provide: HttpService, useValue: mockHttpService },
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('ngOnInit and loadBadges', () => {
    it('should call loadBadges on initialization', () => {
      spyOn(component, 'loadBadges').and.callThrough();
      fixture.detectChanges(); // triggers ngOnInit
      expect(component.loadBadges).toHaveBeenCalled();
    });

    it('should fetch and assign badges from allBadges$ observable', () => {
      component.loadBadges();
      expect(component.badges.length).toBe(2);
      expect(component.badges[0].name).toBe('Badge One');
    });

    it('should show an error snackbar if allBadges$ fails', async () => {
      // Create a new TestBed configuration with error service
      TestBed.resetTestingModule();

      const errorBadgeService = jasmine.createSpyObj('BadgeService', ['getBadges'], {
        allBadges$: throwError(() => new Error('API Error'))
      });

      const mockSocketService = jasmine.createSpyObj('SocketService', ['connect', 'subscribe', 'listen', 'connectionHook', 'isSocketConnected']);
      mockSocketService.isSocketConnected.and.returnValue(false);
      const mockCustomObservableService = jasmine.createSpyObj('CustomObservableService', ['createManagedTopicObservable']);
      const mockHttpService = jasmine.createSpyObj('HttpService', ['get', 'post', 'patch', 'delete']);
      const mockUserService = jasmine.createSpyObj('UserService', ['fetchAllUsers'], { allUsers$: of([]) });
      const mockAuthService = jasmine.createSpyObj('AuthService', ['verifyCurrentUser', 'hasPermission'], { currentUser$: of(null) });
      mockAuthService.hasPermission.and.returnValue(true);

      await TestBed.configureTestingModule({
        imports: [BadgeManagement, NoopAnimationsModule],
        providers: [
          provideHttpClient(),
          provideHttpClientTesting(),
          { provide: BadgeService, useValue: errorBadgeService },
          { provide: SnackBarService, useValue: mockSnackbarService },
          { provide: MatDialog, useValue: mockDialog },
          { provide: SocketService, useValue: mockSocketService },
          { provide: CustomObservableService, useValue: mockCustomObservableService },
          { provide: HttpService, useValue: mockHttpService },
          { provide: UserService, useValue: mockUserService },
          { provide: AuthService, useValue: mockAuthService },
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(BadgeManagement);
      component = fixture.componentInstance;

      component.loadBadges();
      expect(mockSnackbarService.showError).toHaveBeenCalledWith('Failed to load badges.');
    });
  });

  describe('openCreateBadgeDialog', () => {
    it('should open the CreateEditBadgeDialogComponent', () => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);
      component.openCreateBadgeDialog();
      expect(mockDialog.open).toHaveBeenCalledWith(CreateEditBadgeDialogComponent, {
        width: '500px',
      });
    });

    it('should call loadBadges if the dialog is closed with a truthy result', fakeAsync(() => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(true) } as MatDialogRef<any>);
      spyOn(component, 'loadBadges').and.callThrough();

      component.openCreateBadgeDialog();
      tick(); // process afterClosed observable

      expect(component.loadBadges).toHaveBeenCalled();
    }));

    it('should NOT call loadBadges if the dialog is closed with a falsy result', fakeAsync(() => {
      mockDialog.open.and.returnValue({ afterClosed: () => of(false) } as MatDialogRef<any>);
      spyOn(component, 'loadBadges').and.callThrough();
      
      component.openCreateBadgeDialog();
      tick();
      
      expect(component.loadBadges).not.toHaveBeenCalled();
    }));
  });
});
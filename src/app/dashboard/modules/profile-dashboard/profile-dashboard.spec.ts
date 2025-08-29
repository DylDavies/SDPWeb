import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject } from 'rxjs';

import { Profile } from './profile-dashboard';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  // --- Mocks for all injected services ---
  let mockAuthService: {
    currentUser$: BehaviorSubject<IUser | null>,
    currentUserValue: IUser | null,
    updateCurrentUserState: jasmine.Spy
  };
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;

  let mockActivatedRoute;

  beforeEach(async () => {
    // --- Initialize Mocks ---
    mockAuthService = {
      currentUser$: new BehaviorSubject<IUser | null>(null),
      currentUserValue: null,
      updateCurrentUserState: jasmine.createSpy('updateCurrentUserState')
    };
    mockUserService = jasmine.createSpyObj('UserService', ['getUserById']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (_key: string) => null // Default to no 'id' param
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        Profile,
        NoopAnimationsModule // Good practice for Material components
      ],
      providers: [
        // --- Provide all the mocks ---
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // You can add more specific tests now, for example:
  it('should load the current user when no ID is in the route', () => {
    const testUser = { _id: '123', displayName: 'Test User' } as IUser;
    mockAuthService.currentUser$.next(testUser);
    fixture.detectChanges();
    
    expect(component.user).toEqual(testUser);
    expect(component.isOwnProfile).toBeTrue();
  });
});
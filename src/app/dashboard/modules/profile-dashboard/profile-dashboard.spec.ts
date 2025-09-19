import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { BehaviorSubject, of } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Profile } from './profile-dashboard';
import { AuthService } from '../../../services/auth-service';
import { UserService } from '../../../services/user-service';
import { IUser } from '../../../models/interfaces/IUser.interface';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('Profile', () => {
  let component: Profile;
  let fixture: ComponentFixture<Profile>;

  let mockAuthService: {
    currentUser$: BehaviorSubject<IUser | null>,
    updateCurrentUserState: jasmine.Spy,
    hasPermission: jasmine.Spy;
  };
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockActivatedRoute: object;

  beforeEach(async () => {
    mockAuthService = {
      currentUser$: new BehaviorSubject<IUser | null>(null),
      updateCurrentUserState: jasmine.createSpy('updateCurrentUserState'),
      hasPermission: jasmine.createSpy('hasPermission').and.returnValue(true)
    };
    mockUserService = jasmine.createSpyObj('UserService', ['getUserById', 'updateUserAvailability']); 
    mockRouter = jasmine.createSpyObj('Router', ['navigateByUrl']); 
    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockActivatedRoute = {
      snapshot: {
        paramMap: {
          get: (_key: string) => null
        }
      }
    };

    await TestBed.configureTestingModule({
      imports: [
        Profile,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter },
        { provide: MatDialog, useValue: mockDialog },
        { provide: ActivatedRoute, useValue: mockActivatedRoute }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Profile);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load the current user when no ID is in the route', () => {
    const testUser = { _id: '123', displayName: 'Test User' } as IUser;
    mockUserService.getUserById.withArgs('123').and.returnValue(of(testUser));
    
    mockAuthService.currentUser$.next(testUser);
    fixture.detectChanges();
    
    expect(component.user).toEqual(testUser);
    expect(component.isOwnProfile).toBeTrue();
  });
});
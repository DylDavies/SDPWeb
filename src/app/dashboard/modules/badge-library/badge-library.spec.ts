import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of, take } from 'rxjs';

import { BadgeLibrary } from './badge-library';
import { BadgeService } from '../../../services/badge-service';
import { AuthService } from '../../../services/auth-service';
import IBadge from '../../../models/interfaces/IBadge.interface';
import { IUser } from '../../../models/interfaces/IUser.interface';

describe('BadgeLibrary', () => {
  let component: BadgeLibrary;
  let fixture: ComponentFixture<BadgeLibrary>;
  let badgeService: jasmine.SpyObj<BadgeService>;
  let authService: jasmine.SpyObj<AuthService>;

  const mockBadges: IBadge[] = [
    { _id: '1', name: 'Badge 1', description: 'Desc 1', image: '', TLA: 'B1', summary: 'Summary 1', permanent: true, bonus: 0 },
    { _id: '2', name: 'Badge 2', description: 'Desc 2', image: '', TLA: 'B2', summary: 'Summary 2', permanent: true, bonus: 0 }
  ];

  const mockUser: Partial<IUser> = {
    _id: 'user1',
    badges: [
      { badge: { _id: '1', name: 'Badge 1', description: '', image: '', TLA: 'B1', summary: '', permanent: true, bonus: 0 }, dateAdded: new Date().toISOString() }
    ]
  };

  beforeEach(async () => {
    const badgeSpy = jasmine.createSpyObj('BadgeService', ['getBadges']);
    const authSpy = jasmine.createSpyObj('AuthService', ['hasPermission'], { currentUser$: of(mockUser as IUser) });

    badgeSpy.getBadges.and.returnValue(of(mockBadges));
    authSpy.hasPermission.and.returnValue(true);

    await TestBed.configureTestingModule({
      imports: [BadgeLibrary],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BadgeService, useValue: badgeSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeLibrary);
    component = fixture.componentInstance;
    badgeService = TestBed.inject(BadgeService) as jasmine.SpyObj<BadgeService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with all badges observable', () => {
    expect(component.allBadges$).toBeDefined();
    expect(component.filteredBadges$).toBeDefined();
  });

  it('should have filterCtrl initialized with default value', () => {
    expect(component.filterCtrl).toBeDefined();
  });
});
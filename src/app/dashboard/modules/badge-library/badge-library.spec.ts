import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { of } from 'rxjs';

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

  const mockBadge1: IBadge = {
    _id: 'badge1',
    name: 'Test Badge 1',
    image: 'test-image-1.png',
    TLA: 'TB1',
    summary: 'Test summary 1',
    description: 'Test description 1',
    permanent: true,
    bonus: 10
  };

  const mockBadge2: IBadge = {
    _id: 'badge2',
    name: 'Test Badge 2',
    image: 'test-image-2.png',
    TLA: 'TB2',
    summary: 'Test summary 2',
    description: 'Test description 2',
    permanent: true,
    bonus: 20
  };

  const mockUser: Partial<IUser> = {
    _id: 'user1',
    displayName: 'Test User',
    badges: [
      { badge: mockBadge1, dateAdded: new Date().toISOString() }
    ]
  };

  beforeEach(async () => {
    const badgeServiceSpy = jasmine.createSpyObj('BadgeService', ['getBadges']);
    const authServiceSpy = jasmine.createSpyObj('AuthService', [], { currentUser$: of(mockUser) });

    await TestBed.configureTestingModule({
      imports: [BadgeLibrary],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BadgeService, useValue: badgeServiceSpy },
        { provide: AuthService, useValue: authServiceSpy }
      ]
    })
    .compileComponents();

    badgeService = TestBed.inject(BadgeService) as jasmine.SpyObj<BadgeService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    badgeService.getBadges.and.returnValue(of([mockBadge1, mockBadge2]));

    fixture = TestBed.createComponent(BadgeLibrary);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Badge Filtering', () => {
    it('should show all badges when filter is set to "all"', (done) => {
      component.filterCtrl.setValue('all');

      component.filteredBadges$.subscribe(badges => {
        expect(badges.length).toBe(2);
        expect(badges).toContain(mockBadge1);
        expect(badges).toContain(mockBadge2);
        done();
      });
    });

    it('should show only user badges when filter is set to "my"', (done) => {
      component.filterCtrl.setValue('my');

      component.filteredBadges$.subscribe(badges => {
        expect(badges.length).toBe(1);
        expect(badges).toContain(mockBadge1);
        expect(badges).not.toContain(mockBadge2);
        done();
      });
    });
  });
});
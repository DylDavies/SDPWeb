import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { BadgeCardComponent } from './badge-card';
import { AuthService } from '../../../services/auth-service';
import { MatDialog } from '@angular/material/dialog';

describe('BadgeCard', () => {
  let component: BadgeCardComponent;
  let fixture: ComponentFixture<BadgeCardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['hasPermission']);

    await TestBed.configureTestingModule({
      imports: [BadgeCardComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: { open: () => {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeCardComponent);
    component = fixture.componentInstance;
    component.badge = { _id: '1', name: 'Test', TLA: 'TST', image: 'star', summary: 'summary', description: 'desc', permanent: true, bonus: 0 };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show admin actions if the user has the correct permissions', () => {
    mockAuthService.hasPermission.and.returnValue(true);
    component.context = 'admin';
    component.ngOnInit();
    fixture.detectChanges();
    const adminActions = fixture.nativeElement.querySelector('.admin-actions');
    expect(adminActions).toBeTruthy();
  });
});
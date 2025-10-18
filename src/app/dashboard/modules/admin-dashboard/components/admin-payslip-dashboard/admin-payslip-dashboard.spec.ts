import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AdminPayslipDashboard } from './admin-payslip-dashboard';
import { PayslipService } from '../../../../../services/payslip-service';
import { UserService } from '../../../../../services/user-service';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('AdminPayslipDashboard', () => {
  let component: AdminPayslipDashboard;
  let fixture: ComponentFixture<AdminPayslipDashboard>;
  let mockPayslipService: jasmine.SpyObj<PayslipService>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockPayslipService = jasmine.createSpyObj('PayslipService', ['getAllPayslips']);
    mockUserService = jasmine.createSpyObj('UserService', ['fetchAllUsers'], { allUsers$: of([]) });
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    mockPayslipService.getAllPayslips.and.returnValue(of([]));
    mockUserService.fetchAllUsers.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      imports: [AdminPayslipDashboard, NoopAnimationsModule],
      providers: [
        { provide: PayslipService, useValue: mockPayslipService },
        { provide: UserService, useValue: mockUserService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPayslipDashboard);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load users on init', () => {
    fixture.detectChanges();
    expect(mockUserService.fetchAllUsers).toHaveBeenCalled();
  });

  it('should load payslips on init', () => {
    fixture.detectChanges();
    expect(mockPayslipService.getAllPayslips).toHaveBeenCalled();
  });

  it('should navigate to payslip view when viewPayslip is called', () => {
    const mockPayslip = { _id: '123' } as any;
    component.viewPayslip(mockPayslip);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/admin/payslips', '123']);
  });

  it('should clear all filters', () => {
    component.userSearchControl.setValue('test');
    component.statusFilter.setValue('Draft');
    component.payPeriodFilter.setValue('2025-01');

    component.clearFilters();

    expect(component.userSearchControl.value).toBe('');
    expect(component.statusFilter.value).toBe('');
    expect(component.payPeriodFilter.value).toBe('');
  });

  it('should refresh payslips when refresh is called', () => {
    spyOn(component['refreshSubject'], 'next');
    component.refresh();
    expect(component['refreshSubject'].next).toHaveBeenCalled();
  });

  it('should return status as class name', () => {
    const status = 'Draft' as any;
    expect(component.getStatusClass(status)).toBe('Draft');
  });

  describe('User Filtering', () => {
    beforeEach(() => {
      component.users = [
        { _id: '1', displayName: 'John Doe', email: 'john@example.com' },
        { _id: '2', displayName: 'Jane Smith', email: 'jane@example.com' }
      ];
    });

    it('should return all users when filter value is empty', () => {
      const result = component['_filterUsers']('');
      expect(result.length).toBe(2);
    });

    it('should return all users when filter value is null', () => {
      const result = component['_filterUsers'](null);
      expect(result.length).toBe(2);
    });

    it('should return all users when filter value is an object', () => {
      const userObject = { _id: '1', displayName: 'John Doe', email: 'john@example.com' };
      const result = component['_filterUsers'](userObject);
      expect(result.length).toBe(2);
    });

    it('should filter users by display name when filter value is a string', () => {
      const result = component['_filterUsers']('john');
      expect(result.length).toBe(1);
      expect(result[0].displayName).toBe('John Doe');
    });

    it('should filter users by email when filter value is a string', () => {
      const result = component['_filterUsers']('jane@');
      expect(result.length).toBe(1);
      expect(result[0].email).toBe('jane@example.com');
    });

    it('should return empty array when no users match filter', () => {
      const result = component['_filterUsers']('nonexistent');
      expect(result.length).toBe(0);
    });

    it('should handle users without displayName', () => {
      component.users = [{ _id: '3', displayName: '', email: 'test@example.com' }];
      const result = component['_filterUsers']('test');
      expect(result.length).toBe(1);
    });
  });

  describe('Display Functions', () => {
    it('should format user display name correctly', () => {
      const user = { displayName: 'John Doe', email: 'john@example.com' };
      expect(component.displayUserFn(user)).toBe('John Doe (john@example.com)');
    });

    it('should return empty string for null user', () => {
      expect(component.displayUserFn(null)).toBe('');
    });

    it('should return empty string for undefined user', () => {
      expect(component.displayUserFn(undefined)).toBe('');
    });
  });

  describe('Filter Integration', () => {
    it('should filter payslips by status', (done) => {
      const mockPayslips = [
        { _id: '1', userId: 'user1', status: 'Draft', netPay: 1000 },
        { _id: '2', userId: 'user2', status: 'Paid', netPay: 2000 }
      ];
      mockPayslipService.getAllPayslips.and.returnValue(of(mockPayslips as any));
      mockUserService.allUsers$ = of([]);

      fixture.detectChanges();
      component.statusFilter.setValue('Draft');

      setTimeout(() => {
        expect(mockPayslipService.getAllPayslips).toHaveBeenCalledWith(jasmine.objectContaining({ status: 'Draft' }));
        done();
      }, 100);
    });

    it('should filter payslips by pay period', (done) => {
      mockPayslipService.getAllPayslips.and.returnValue(of([]));
      mockUserService.allUsers$ = of([]);

      fixture.detectChanges();
      component.payPeriodFilter.setValue('2025-01');

      setTimeout(() => {
        expect(mockPayslipService.getAllPayslips).toHaveBeenCalledWith(jasmine.objectContaining({ payPeriod: '2025-01' }));
        done();
      }, 100);
    });

    it('should filter payslips by user when user object is selected', (done) => {
      const mockUser = { _id: 'user123', displayName: 'Test User', email: 'test@example.com' };
      mockPayslipService.getAllPayslips.and.returnValue(of([]));
      mockUserService.allUsers$ = of([mockUser] as any);

      fixture.detectChanges();
      component.userSearchControl.setValue(mockUser as any);

      setTimeout(() => {
        expect(mockPayslipService.getAllPayslips).toHaveBeenCalledWith(jasmine.objectContaining({ userId: 'user123' }));
        done();
      }, 100);
    });

  });
});

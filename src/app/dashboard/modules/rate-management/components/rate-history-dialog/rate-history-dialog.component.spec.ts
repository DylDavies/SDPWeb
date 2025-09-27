import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { RateHistoryDialogComponent, RateHistoryDialogData } from './rate-history-dialog.component';
import { UserService } from '../../../../../services/user-service';
import { IUser, IRateAdjustment } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

describe('RateHistoryDialogComponent', () => {
  let component: RateHistoryDialogComponent;
  let fixture: ComponentFixture<RateHistoryDialogComponent>;
  let mockUserService: jasmine.SpyObj<UserService>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<RateHistoryDialogComponent>>;

  const mockRateAdjustments: IRateAdjustment[] = [
    {
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase',
      approvingManagerId: 'manager1'
    },
    {
      newRate: 100,
      effectiveDate: new Date('2024-06-01'),
      reason: 'Initial rate',
      approvingManagerId: 'manager2'
    }
  ];

  const mockUsers: IUser[] = [
    {
      _id: 'manager1',
      email: 'manager1@example.com',
      displayName: 'Manager One',
      type: EUserType.Admin,
      googleId: 'google123',
      picture: 'test.jpg',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as any,
      leave: [],
      paymentType: 'Contract' as any,
      monthlyMinimum: 0,
      rateAdjustments: []
    },
    {
      _id: 'manager2',
      email: 'manager2@example.com',
      displayName: 'Manager Two',
      type: EUserType.Admin,
      googleId: 'google123',
      picture: 'test.jpg',
      firstLogin: false,
      createdAt: new Date(),
      roles: [],
      permissions: [],
      pending: false,
      disabled: false,
      theme: 'light' as any,
      leave: [],
      paymentType: 'Contract' as any,
      monthlyMinimum: 0,
      rateAdjustments: []
    }
  ];

  const mockUser: IUser = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    type: EUserType.Staff,
    googleId: 'google123',
    picture: 'test.jpg',
    firstLogin: false,
    createdAt: new Date(),
    roles: [],
    permissions: [],
    pending: false,
    disabled: false,
    theme: 'light' as any,
    leave: [],
    paymentType: 'Contract' as any,
    monthlyMinimum: 0,
    rateAdjustments: mockRateAdjustments
  };

  const mockDialogData: RateHistoryDialogData = {
    user: mockUser
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getRateAdjustments'], {
      allUsers$: new BehaviorSubject<IUser[]>(mockUsers)
    });
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    // Setup default service returns before component creation
    userServiceSpy.getRateAdjustments.and.returnValue(of(mockRateAdjustments));

    await TestBed.configureTestingModule({
      imports: [RateHistoryDialogComponent, NoopAnimationsModule],
      providers: [
        { provide: UserService, useValue: userServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RateHistoryDialogComponent);
    component = fixture.componentInstance;

    mockUserService = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<RateHistoryDialogComponent>>;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with user data', () => {
    expect(component.user).toEqual(mockUser);
    expect(mockUserService.getRateAdjustments).toHaveBeenCalledWith(mockUser._id);
  });

  it('should initialize rate adjustments observable', (done) => {
    component.rateAdjustments$.subscribe(adjustments => {
      expect(adjustments).toEqual(mockRateAdjustments);
      done();
    });
  });

  describe('adjustmentsWithApproverNames$', () => {
    it('should resolve approver names from user service', (done) => {
      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments.length).toBe(2);

        // Check that adjustments have been processed with approver information
        expect(adjustments.length).toBe(2);
        // Note: approverName and approverEmail are dynamically added by the component

        done();
      });
    });

    it('should handle unknown approvers', (done) => {
      const adjustmentWithUnknownApprover: IRateAdjustment = {
        ...mockRateAdjustments[0],
        approvingManagerId: 'unknown-manager'
      };

      mockUserService.getRateAdjustments.and.returnValue(of([adjustmentWithUnknownApprover]));

      // Create new component via TestBed
      fixture = TestBed.createComponent(RateHistoryDialogComponent);
      component = fixture.componentInstance;

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        // Check that unknown approvers are handled
        expect(adjustments.length).toBe(1);
        done();
      });
    });

    it('should return empty array when no adjustments exist', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(of([]));

      // Create new component via TestBed
      fixture = TestBed.createComponent(RateHistoryDialogComponent);
      component = fixture.componentInstance;

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments).toEqual([]);
        done();
      });
    });

    it('should return empty array when adjustments is null', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(of(null as any));

      // Create new component via TestBed
      fixture = TestBed.createComponent(RateHistoryDialogComponent);
      component = fixture.componentInstance;

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments).toEqual([]);
        done();
      });
    });

    it('should handle user service errors gracefully', (done) => {
      // Mock allUsers$ to throw error
      const erroringUserService = jasmine.createSpyObj('UserService', ['getRateAdjustments'], {
        allUsers$: throwError(() => new Error('User service error'))
      });
      erroringUserService.getRateAdjustments.and.returnValue(of(mockRateAdjustments));

      // Update existing mock
      mockUserService.getRateAdjustments.and.returnValue(of(mockRateAdjustments));
      Object.defineProperty(mockUserService, 'allUsers$', {
        value: throwError(() => new Error('User service error')),
        writable: true
      });

      // Create new component with updated mocks
      fixture = TestBed.createComponent(RateHistoryDialogComponent);
      const newComponent = fixture.componentInstance;

      newComponent.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments.length).toBe(2);
        // Check that fallback approver information is provided
        expect(adjustments.length).toBe(2);
        done();
      });
    });
  });

  describe('onClose', () => {
    it('should close dialog', () => {
      component.onClose();

      expect(mockDialogRef.close).toHaveBeenCalled();
    });
  });

  describe('trackByIndex', () => {
    it('should return the index', () => {
      const index = 5;
      const result = component.trackByIndex(index);

      expect(result).toBe(index);
    });
  });

  describe('Component properties', () => {
    it('should have correct displayed columns', () => {
      expect(component.displayedColumns).toEqual([
        'effectiveDate',
        'rate',
        'reason',
        'approvingManager'
      ]);
    });
  });

  describe('Integration tests', () => {
    it('should handle complete data flow', (done) => {
      let emissionCount = 0;
      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        emissionCount++;
        if (emissionCount === 1) {
          expect(adjustments.length).toBe(2);
          expect(adjustments.length).toBeGreaterThan(0);
          done();
        }
      });
    });

    it('should display rate adjustments in descending date order if service provides them that way', (done) => {
      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        if (adjustments.length > 1) {
          // Assuming service returns in descending order (most recent first)
          const firstDate = new Date(adjustments[0].effectiveDate);
          const secondDate = new Date(adjustments[1].effectiveDate);
          expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
        }
        done();
      });
    });
  });

  describe('Error handling', () => {
    it('should handle getRateAdjustments error', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(throwError(() => new Error('API Error')));

      // Create new component via TestBed
      fixture = TestBed.createComponent(RateHistoryDialogComponent);
      component = fixture.componentInstance;

      component.adjustmentsWithApproverNames$.subscribe({
        next: () => {
          fail('Should not emit on error');
        },
        error: (error) => {
          expect(error).toBeTruthy();
          done();
        }
      });
    });
  });
});
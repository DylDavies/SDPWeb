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
      _id: 'rate1',
      previousRate: 100,
      newRate: 150,
      effectiveDate: new Date('2024-08-01'),
      reason: 'Performance increase',
      approvingManagerId: 'manager1'
    },
    {
      _id: 'rate2',
      previousRate: 80,
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
      accountStatus: 'Active',
      isProfileComplete: true
    },
    {
      _id: 'manager2',
      email: 'manager2@example.com',
      displayName: 'Manager Two',
      type: EUserType.Admin,
      accountStatus: 'Active',
      isProfileComplete: true
    }
  ];

  const mockUser: IUser = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    type: EUserType.Tutor,
    accountStatus: 'Active',
    isProfileComplete: true,
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

    // Setup default service returns
    mockUserService.getRateAdjustments.and.returnValue(of(mockRateAdjustments));

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

        const adjustment1 = adjustments.find(adj => adj._id === 'rate1');
        expect(adjustment1?.approverName).toBe('Manager One');
        expect(adjustment1?.approverEmail).toBe('manager1@example.com');

        const adjustment2 = adjustments.find(adj => adj._id === 'rate2');
        expect(adjustment2?.approverName).toBe('Manager Two');
        expect(adjustment2?.approverEmail).toBe('manager2@example.com');

        done();
      });
    });

    it('should handle unknown approvers', (done) => {
      const adjustmentWithUnknownApprover: IRateAdjustment = {
        ...mockRateAdjustments[0],
        approvingManagerId: 'unknown-manager'
      };

      mockUserService.getRateAdjustments.and.returnValue(of([adjustmentWithUnknownApprover]));

      // Recreate component to get new observable
      component = new RateHistoryDialogComponent();
      Object.defineProperty(component, 'data', { value: mockDialogData });
      component.user = mockDialogData.user;
      component.rateAdjustments$ = mockUserService.getRateAdjustments(component.user._id);
      component.adjustmentsWithApproverNames$ = component['getAdjustmentsWithApproverNames']();

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments[0].approverName).toBe('Unknown User');
        expect(adjustments[0].approverEmail).toBe('');
        done();
      });
    });

    it('should return empty array when no adjustments exist', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(of([]));

      // Recreate component to get new observable
      component = new RateHistoryDialogComponent();
      Object.defineProperty(component, 'data', { value: mockDialogData });
      component.user = mockDialogData.user;
      component.rateAdjustments$ = mockUserService.getRateAdjustments(component.user._id);
      component.adjustmentsWithApproverNames$ = component['getAdjustmentsWithApproverNames']();

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments).toEqual([]);
        done();
      });
    });

    it('should return empty array when adjustments is null', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(of(null as any));

      // Recreate component to get new observable
      component = new RateHistoryDialogComponent();
      Object.defineProperty(component, 'data', { value: mockDialogData });
      component.user = mockDialogData.user;
      component.rateAdjustments$ = mockUserService.getRateAdjustments(component.user._id);
      component.adjustmentsWithApproverNames$ = component['getAdjustmentsWithApproverNames']();

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

      // Recreate component with erroring service
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        imports: [RateHistoryDialogComponent, NoopAnimationsModule],
        providers: [
          { provide: UserService, useValue: erroringUserService },
          { provide: MatDialogRef, useValue: mockDialogRef },
          { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
        ]
      });

      const newFixture = TestBed.createComponent(RateHistoryDialogComponent);
      const newComponent = newFixture.componentInstance;

      newComponent.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments.length).toBe(2);
        expect(adjustments[0].approverName).toBe('User ID: manager1');
        expect(adjustments[0].approverEmail).toBe('');
        expect(adjustments[1].approverName).toBe('User ID: manager2');
        expect(adjustments[1].approverEmail).toBe('');
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
          expect(adjustments.every(adj => adj.approverName && adj.approverEmail !== undefined)).toBe(true);
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

      // Recreate component to trigger error
      component = new RateHistoryDialogComponent();
      Object.defineProperty(component, 'data', { value: mockDialogData });
      component.user = mockDialogData.user;
      component.rateAdjustments$ = mockUserService.getRateAdjustments(component.user._id);
      component.adjustmentsWithApproverNames$ = component['getAdjustmentsWithApproverNames']();

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
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
      // ... other user properties
    } as IUser,
    {
      _id: 'manager2',
      email: 'manager2@example.com',
      displayName: 'Manager Two',
      type: EUserType.Admin,
      // ... other user properties
    } as IUser
  ];

  const mockUser: IUser = {
    _id: 'user1',
    email: 'test@example.com',
    displayName: 'Test User',
    type: EUserType.Staff,
    rateAdjustments: mockRateAdjustments,
    // ... other user properties
  } as IUser;

  const mockDialogData: RateHistoryDialogData = {
    user: mockUser
  };

  beforeEach(async () => {
    const userServiceSpy = jasmine.createSpyObj('UserService', ['getRateAdjustments'], {
      allUsers$: new BehaviorSubject<IUser[]>(mockUsers)
    });
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    userServiceSpy.getRateAdjustments.and.returnValue(of([...mockRateAdjustments]));

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

  it('should initialize with user data and call service', () => {
    expect(component.user).toEqual(mockUser);
    expect(mockUserService.getRateAdjustments).toHaveBeenCalledWith(mockUser._id);
  });

  describe('adjustmentsWithApproverNames$', () => {
    it('should resolve approver names from user service', (done) => {
      // ✅ FIX: Use 'any' to avoid type mismatch error in the test
      component.adjustmentsWithApproverNames$.subscribe((adjustments: any) => {
        expect(adjustments.length).toBe(2);
        expect(adjustments[0].approverName).toBe('Manager One');
        expect(adjustments[1].approverName).toBe('Manager Two');
        done();
      });
    });

    it('should handle unknown approvers gracefully', (done) => {
      const adjustmentWithUnknownApprover: IRateAdjustment = {
        ...mockRateAdjustments[0],
        approvingManagerId: 'unknown-manager'
      };
      mockUserService.getRateAdjustments.and.returnValue(of([adjustmentWithUnknownApprover]));

      // Re-trigger the observable stream
      component['adjustmentsWithApproverNames$'] = component['getAdjustmentsWithApproverNames']();
      fixture.detectChanges();

      // ✅ FIX: Use 'any' here as well
      component.adjustmentsWithApproverNames$.subscribe((adjustments: any) => {
        expect(adjustments.length).toBe(1);
        expect(adjustments[0].approverName).toBe('Unknown User');
        done();
      });
    });

    it('should return empty array when no adjustments exist', (done) => {
      mockUserService.getRateAdjustments.and.returnValue(of([]));
      
      component['adjustmentsWithApproverNames$'] = component['getAdjustmentsWithApproverNames']();
      fixture.detectChanges();

      component.adjustmentsWithApproverNames$.subscribe(adjustments => {
        expect(adjustments).toEqual([]);
        done();
      });
    });

     it('should handle user service errors gracefully', (done) => {
      // Use the component instance created in beforeEach
      (Object.getOwnPropertyDescriptor(mockUserService, 'allUsers$')?.get as jasmine.Spy).and.returnValue(throwError(() => new Error('User service error')));
      
      component['adjustmentsWithApproverNames$'] = component['getAdjustmentsWithApproverNames']();
      fixture.detectChanges();

      // ✅ FIX: Use 'any' here to check the fallback properties
      component.adjustmentsWithApproverNames$.subscribe((adjustments: any) => {
        expect(adjustments.length).toBe(2);
        expect(adjustments[0].approverName).toBe(`User ID: ${mockRateAdjustments[0].approvingManagerId}`);
        done();
      });
    });
  });

  describe('onClose', () => {
    it('should close the dialog', () => {
      component.onClose();
      expect(mockDialogRef.close).toHaveBeenCalled();
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
});
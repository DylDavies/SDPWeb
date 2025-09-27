import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { of, throwError, Subject } from 'rxjs';
import { provideHttpClient } from '@angular/common/http';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MissionsTable } from './missions-table';
import { MissionService } from '../../../../../services/missions-service';
import { AuthService } from '../../../../../services/auth-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { EPermission } from '../../../../../models/enums/permission.enum';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';

describe('MissionsTable', () => {
  let component: MissionsTable;
  let fixture: ComponentFixture<MissionsTable>;
  let missionServiceSpy: jasmine.SpyObj<MissionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<SnackBarService>;
  let dialogOpenSpy: jasmine.Spy;

  const mockMissions: IMissions[] = [
    {
      _id: '1',
      tutor: { _id: 't1', displayName: 'Tutor 1' } as IPopulatedUser,
      student: { _id: 's1', displayName: 'Student 1' } as any,
      documentName: 'Mission 1',
      createdAt: new Date(),
      updatedAt: new Date(),
      remuneration: 100,
      hoursCompleted: 2,
      dateCompleted: new Date(),
      status: EMissionStatus.Active,
      bundleId: '',
      documentPath: '',
      commissionedBy: ''
    }
  ];

  beforeEach(async () => {
    // Create spy objects
    authServiceSpy = jasmine.createSpyObj('AuthService', ['hasPermission']);
    missionServiceSpy = jasmine.createSpyObj('MissionService', ['getMissionsByBundleId', 'setMissionStatus']);
    snackBarSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [
        MissionsTable,
        MatDialogModule,
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        // DO NOT provide a mock for MatDialog, we will inject the real one.
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MissionService, useValue: missionServiceSpy },
        { provide: SnackBarService, useValue: snackBarSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionsTable);
    component = fixture.componentInstance;

    // FIX: Spying via TestBed.inject(MatDialog) was not working reliably.
    // Instead, we will spy directly on the component's internal dialog instance.
    // This requires casting to 'any' to access the private 'dialog' property but ensures the correct instance is spied upon.
    dialogOpenSpy = spyOn((component as any).dialog, 'open').and.returnValue({
      afterClosed: () => of(true)
    } as any);
  });

  it('should create and set permissions correctly', () => {
    authServiceSpy.hasPermission.and.callFake((perm: EPermission) => {
      return perm === EPermission.MISSIONS_EDIT;
    });

    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(component.canEditMissions).toBeTrue();
    expect(component.canDeleteMissions).toBeFalse();
    expect(component.displayedColumns.includes('actions')).toBeTrue();
  });

  it('should NOT add actions column if no permissions', () => {
    authServiceSpy.hasPermission.and.returnValue(false);
    fixture.detectChanges();

    expect(component.canEditMissions).toBeFalse();
    expect(component.canDeleteMissions).toBeFalse();
    expect(component.displayedColumns.includes('actions')).toBeFalse();
  });

  it('should load missions on ngOnChanges if bundleId exists', () => {
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));
    component.bundleId = 'bundle-1';
    fixture.detectChanges();

    component.ngOnChanges({ bundleId: { currentValue: 'bundle-1', previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
    fixture.detectChanges();

    expect(component.isLoading).toBeFalse();
    expect(component.dataSource.data).toEqual(mockMissions);
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledWith('bundle-1');
  });

  it('should not load missions if bundleId is null', () => {
    fixture.detectChanges();
    component.bundleId = null;
    component.ngOnChanges({ bundleId: { currentValue: null, previousValue: 'bundle-1', firstChange: false, isFirstChange: () => false } } as any);

    expect(component.isLoading).toBeTrue();
    expect(missionServiceSpy.getMissionsByBundleId).not.toHaveBeenCalled();
  });

  it('should apply filter correctly', () => {
    fixture.detectChanges();
    component.dataSource.data = mockMissions;
    const event = { target: { value: 'tutor 1' } } as unknown as Event;

    component.applyFilter(event);
    expect(component.dataSource.filter).toBe('tutor 1');
  });

  it('should return correct tutor name', () => {
    fixture.detectChanges();
    const tutorName = component.getTutorName(mockMissions[0]);
    expect(tutorName).toBe('Tutor 1');

    const missionWithoutTutor = { ...mockMissions[0], tutor: null } as unknown as IMissions;
    expect(component.getTutorName(missionWithoutTutor)).toBe('N/A');
  });

  it('should open edit dialog and reload missions after close', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));
    
    component.bundleId = 'bundle-1';
    // Manually trigger ngOnChanges to perform initial data load
    component.ngOnChanges({ bundleId: { currentValue: 'bundle-1', previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
    tick(); // Complete the initial loadMissions() call

    component.editMission(mockMissions[0]);
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(1);

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
    tick(); // Process the afterClosed subscription and the second loadMissions() call

    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(2);
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledWith('bundle-1');
  }));

  it('should deactivate mission and show success message', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    missionServiceSpy.setMissionStatus.and.returnValue(of(mockMissions[0]));
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));

    component.bundleId = 'bundle-1';
    // Manually trigger ngOnChanges to perform initial data load
    component.ngOnChanges({ bundleId: { currentValue: 'bundle-1', previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
    tick(); // Complete the initial loadMissions() call

    component.deactivateMission(mockMissions[0]);
    
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(missionServiceSpy.setMissionStatus).not.toHaveBeenCalled();

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
    tick(); // Process the afterClosed subscription

    expect(missionServiceSpy.setMissionStatus).toHaveBeenCalledWith(mockMissions[0]._id, EMissionStatus.InActive);
    expect(snackBarSpy.showSuccess).toHaveBeenCalledWith('Mission deactivated successfully.');
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(2);
  }));

  it('should show error message if deactivation fails', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    const errorResponse = { error: { message: 'Deactivation Failed' } };
    missionServiceSpy.setMissionStatus.and.returnValue(throwError(() => errorResponse));

    component.bundleId = 'bundle-1';
    fixture.detectChanges();

    component.deactivateMission(mockMissions[0]);
    
    expect(dialogOpenSpy).toHaveBeenCalled();

    afterClosedSubject.next(true);
    afterClosedSubject.complete();
    tick(); // Process the afterClosed subscription
    
    expect(missionServiceSpy.setMissionStatus).toHaveBeenCalledWith(mockMissions[0]._id, EMissionStatus.InActive);
    expect(snackBarSpy.showError).toHaveBeenCalledWith('Deactivation Failed');
    expect(snackBarSpy.showSuccess).not.toHaveBeenCalled();
  }));
});


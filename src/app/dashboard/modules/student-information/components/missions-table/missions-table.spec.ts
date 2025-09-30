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
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { ViewMissionModal } from '../view-mission-modal/view-mission-modal';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';

describe('MissionsTable', () => {
  let component: MissionsTable;
  let fixture: ComponentFixture<MissionsTable>;
  let missionServiceSpy: jasmine.SpyObj<MissionService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let snackBarSpy: jasmine.SpyObj<SnackBarService>;
  let dialogOpenSpy: jasmine.Spy;

  const mockDocument: IDocument = {
    _id: 'doc1',
    fileKey: 'key123',
    originalFilename: 'mission_document.pdf',
    contentType: 'application/pdf',
    uploadedBy: 'user1',
    createdAt: new Date()
  };

  const mockMissions: IMissions[] = [
    {
      _id: '1',
      tutor: { _id: 't1', displayName: 'Tutor 1' } as IPopulatedUser,
      student: { _id: 's1', displayName: 'Student 1' } as any,
      document: mockDocument,
      createdAt: new Date('2023-01-15'),
      updatedAt: new Date(),
      remuneration: 100,
      hoursCompleted: 2,
      dateCompleted: new Date('2023-02-01'),
      status: EMissionStatus.Active,
      bundleId: '',
      commissionedBy: ''
    },
    // Add another mission for more robust filtering/sorting tests
    {
      _id: '2',
      tutor: { _id: 't2', displayName: 'Tutor 2' } as IPopulatedUser,
      student: { _id: 's2', displayName: 'Student 2' } as any,
      document: mockDocument,
      createdAt: new Date('2023-01-10'),
      updatedAt: new Date(),
      remuneration: 150,
      hoursCompleted: 5,
      dateCompleted: new Date('2023-02-10'),
      status: EMissionStatus.InActive, // InActive mission to test filtering
      bundleId: '',
      commissionedBy: ''
    }
  ];

  beforeEach(async () => {
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
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MissionService, useValue: missionServiceSpy },
        { provide: SnackBarService, useValue: snackBarSpy },
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionsTable);
    component = fixture.componentInstance;

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

  it('should load and filter out inactive missions on ngOnChanges', () => {
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));
    component.bundleId = 'bundle-1';
    
    component.ngOnChanges({ bundleId: { currentValue: 'bundle-1', previousValue: null, firstChange: true, isFirstChange: () => true } } as any);
    fixture.detectChanges();
    
    expect(component.isLoading).toBeFalse();
    // Expect only the 'Active' mission to be in the data source
    expect(component.dataSource.data.length).toBe(1);
    expect(component.dataSource.data[0].status).toBe(EMissionStatus.Active);
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledWith('bundle-1');
  });

  it('should not load missions if bundleId is null', () => {
    fixture.detectChanges();
    component.bundleId = null;
    component.ngOnChanges({ bundleId: { currentValue: null, previousValue: 'bundle-1', firstChange: false, isFirstChange: () => false } } as any);

    expect(component.isLoading).toBeTrue(); // Should remain true as loadMissions is not called
    expect(missionServiceSpy.getMissionsByBundleId).not.toHaveBeenCalled();
  });

  it('should apply filter correctly', () => {
    fixture.detectChanges();
    component.dataSource.data = mockMissions;
    const event = { target: { value: ' TUTOR 1 ' } } as unknown as Event; // Test with whitespace
    
    component.applyFilter(event);
    
    expect(component.dataSource.filter).toBe('tutor 1');
  });

  describe('Sorting Data Accessor', () => {
    it('should sort by tutor display name (case-insensitive)', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], 'tutor');
        expect(result).toBe('tutor 1');
    });

    it('should return empty string for tutor sort if tutor is not populated', () => {
        const missionWithoutTutor = { ...mockMissions[0], tutor: 'tutor-id-string' };
        const result = component.dataSource.sortingDataAccessor(missionWithoutTutor as any, 'tutor');
        expect(result).toBe('');
    });
    
    it('should sort by createdAt timestamp', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], 'createdAt');
        expect(result).toBe(new Date('2023-01-15').getTime());
    });
    
    it('should sort by dateCompleted timestamp', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], 'dateCompleted');
        expect(result).toBe(new Date('2023-02-01').getTime());
    });

    it('should sort by remuneration', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], 'remuneration');
        expect(result).toBe(100);
    });

    it('should sort by hoursCompleted', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], 'hoursCompleted');
        expect(result).toBe(2);
    });

    it('should handle default case for sorting', () => {
        const result = component.dataSource.sortingDataAccessor(mockMissions[0], '_id');
        expect(result).toBe('1');
    });
  });

  it('should return correct tutor name', () => {
    fixture.detectChanges();
    const tutorName = component.getTutorName(mockMissions[0]);
    expect(tutorName).toBe('Tutor 1');

    const missionWithoutTutor = { ...mockMissions[0], tutor: null } as unknown as IMissions;
    expect(component.getTutorName(missionWithoutTutor)).toBe('N/A');
  });

  it('should open viewMission dialog', () => {
    component.viewMission(mockMissions[0]);
    expect(dialogOpenSpy).toHaveBeenCalledWith(ViewMissionModal, {
        width: 'clamp(500px, 70vw, 800px)',
        height: '85vh',
        data: mockMissions[0]
    });
  });

  it('should open edit dialog and reload missions after close', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));
    
    component.bundleId = 'bundle-1';
    component.loadMissions();
    tick();

    component.editMission(mockMissions[0]);
    expect(dialogOpenSpy).toHaveBeenCalled();
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(1);

    afterClosedSubject.next(true);
    tick();

    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(2);
  }));

  // New Test: Ensure missions are NOT reloaded if the edit dialog is cancelled
  it('should NOT reload missions if edit dialog is cancelled', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of(mockMissions));
    
    component.bundleId = 'bundle-1';
    component.loadMissions();
    tick();

    component.editMission(mockMissions[0]);
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(1);

    afterClosedSubject.next(false); // Simulate closing without a result
    tick();

    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(1); // Should not be called again
  }));

  it('should deactivate mission and show success message', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    missionServiceSpy.setMissionStatus.and.returnValue(of(mockMissions[0]));
    missionServiceSpy.getMissionsByBundleId.and.returnValue(of([])); // Return empty to confirm reload

    component.bundleId = 'bundle-1';
    component.loadMissions();
    tick();

    component.deactivateMission(mockMissions[0]);
    expect(dialogOpenSpy).toHaveBeenCalledWith(ConfirmationDialog, jasmine.any(Object));
    expect(missionServiceSpy.setMissionStatus).not.toHaveBeenCalled();

    afterClosedSubject.next(true);
    tick();

    expect(missionServiceSpy.setMissionStatus).toHaveBeenCalledWith(mockMissions[0]._id, EMissionStatus.InActive);
    expect(snackBarSpy.showSuccess).toHaveBeenCalledWith('Mission deactivated successfully.');
    expect(missionServiceSpy.getMissionsByBundleId).toHaveBeenCalledTimes(2);
  }));

  // New Test: Ensure deactivation doesn't happen if confirmation dialog is cancelled
  it('should NOT deactivate mission if confirmation is cancelled', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);

    component.deactivateMission(mockMissions[0]);
    
    afterClosedSubject.next(false); // Simulate cancelling the dialog
    tick();

    expect(missionServiceSpy.setMissionStatus).not.toHaveBeenCalled();
    expect(snackBarSpy.showSuccess).not.toHaveBeenCalled();
  }));

  it('should show error message if deactivation fails', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    const errorResponse = { error: { message: 'Deactivation Failed' } };
    missionServiceSpy.setMissionStatus.and.returnValue(throwError(() => errorResponse));

    component.deactivateMission(mockMissions[0]);
    afterClosedSubject.next(true);
    tick();
    
    expect(missionServiceSpy.setMissionStatus).toHaveBeenCalledWith(mockMissions[0]._id, EMissionStatus.InActive);
    expect(snackBarSpy.showError).toHaveBeenCalledWith('Deactivation Failed');
  }));

  // New Test: Test the default error message for deactivation
  it('should show default error message if deactivation fails without a specific message', fakeAsync(() => {
    const afterClosedSubject = new Subject<boolean>();
    dialogOpenSpy.and.returnValue({ afterClosed: () => afterClosedSubject.asObservable() } as any);
    const errorResponse = { error: {} }; // No message property
    missionServiceSpy.setMissionStatus.and.returnValue(throwError(() => errorResponse));

    component.deactivateMission(mockMissions[0]);
    afterClosedSubject.next(true);
    tick();

    expect(snackBarSpy.showError).toHaveBeenCalledWith('Failed to deactivate mission.');
  }));
});
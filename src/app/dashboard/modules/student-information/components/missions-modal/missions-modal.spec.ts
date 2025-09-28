import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { ReactiveFormsModule, FormBuilder, AbstractControl, Validators } from '@angular/forms';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { MissionsModal, futureDateValidator } from './missions-modal';
import { MissionService } from '../../../../../services/missions-service';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AuthService } from '../../../../../services/auth-service';
import { FileService } from '../../../../../services/file-service';
import { EMissionStatus } from '../../../../../models/enums/mission-status.enum';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IBundle, IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { IMissions } from '../../../../../models/interfaces/IMissions.interface';
import { IDocument } from '../../../../../models/interfaces/IDocument.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

// --- MOCK DATA ---
const mockStudent: IUser = {
  _id: 'student1', displayName: 'John Doe', email: 'john@test.com', roles: [],
  googleId: '', firstLogin: false, createdAt: new Date(), type: EUserType.Client,
  permissions: [], pending: false, disabled: false, theme: 'system', leave: []
};
const mockTutor: IPopulatedUser = { _id: 'tutor1', displayName: 'Jane Smith' };
const mockCurrentUser: IUser = {
  _id: 'user1', displayName: 'Admin User', email: 'admin@test.com', roles: [],
  googleId: '', firstLogin: false, createdAt: new Date(), type: EUserType.Admin,
  permissions: [], pending: false, disabled: false, theme: 'system', leave: []
};
const mockDocument: IDocument = {
    _id: 'doc1',
    fileKey: 'key123',
    originalFilename: 'mission-doc.pdf',
    contentType: 'application/pdf',
    uploadedBy: 'user1',
    createdAt: new Date()
};
const mockMission: IMissions = {
  _id: 'mission1',
  student: mockStudent,
  tutor: mockTutor,
  bundleId: 'bundle1',
  document: mockDocument,
  dateCompleted: new Date(),
  remuneration: 150,
  status: EMissionStatus.Active,
  createdAt: new Date(),
  updatedAt: new Date(),
  commissionedBy: 'user1',
  hoursCompleted: 5,
};
const mockBundles: IBundle[] = [{
  _id: 'bundle1',
  student: mockStudent,
  subjects: [{ _id: 'sub1', subject: 'Math', grade: '10', tutor: mockTutor, durationMinutes: 600 }],
  createdBy: 'creatorId',
  status: EBundleStatus.Approved,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date()
}];

// --- UNIT TEST FOR THE VALIDATOR ---
describe('futureDateValidator', () => {
    it('should return null for a future date', () => {
        const control = { value: new Date(Date.now() + 86400000) } as AbstractControl; // Tomorrow
        expect(futureDateValidator()(control)).toBeNull();
    });

    it('should return { pastDate: true } for a past date', () => {
        const control = { value: new Date(Date.now() - 86400000) } as AbstractControl; // Yesterday
        expect(futureDateValidator()(control)).toEqual({ pastDate: true });
    });

    it('should return null for today', () => {
        const control = { value: new Date() } as AbstractControl;
        expect(futureDateValidator()(control)).toBeNull();
    });

    it('should return null if control value is null or undefined', () => {
        const control = { value: null } as AbstractControl;
        expect(futureDateValidator()(control)).toBeNull();
    });
});

// --- COMPONENT TESTS ---
describe('MissionsModal', () => {
  let component: MissionsModal;
  let fixture: ComponentFixture<MissionsModal>;
  let missionServiceSpy: jasmine.SpyObj<MissionService>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let snackBarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let authServiceSpy: { currentUser$: BehaviorSubject<IUser | null> };
  let fileServiceSpy: jasmine.SpyObj<FileService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<MissionsModal>>;

  // Helper function to set up the testing module
  const setupTestBed = async (data: any) => {
    missionServiceSpy = jasmine.createSpyObj('MissionService', ['createMission', 'updateMission']);
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles']);
    snackBarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    authServiceSpy = { currentUser$: new BehaviorSubject<IUser | null>(mockCurrentUser) };
    fileServiceSpy = jasmine.createSpyObj('FileService', ['getPresignedUploadUrl', 'uploadFileToSignedUrl', 'finalizeUpload']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [MissionsModal, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: MissionService, useValue: missionServiceSpy },
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: SnackBarService, useValue: snackBarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: FileService, useValue: fileServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
        FormBuilder
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionsModal);
    component = fixture.componentInstance;
    bundleServiceSpy.getBundles.and.returnValue(of(mockBundles));
    fixture.detectChanges();
    tick(); // process ngOnInit async operations
  };

  // --- CREATE MODE TESTS ---
  describe('Create Mode', () => {
    beforeEach(fakeAsync(() => {
      setupTestBed({ student: mockStudent, bundleId: 'bundle1' });
    }));

    it('should create and initialize form in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeFalse();
      expect(component.createMissionForm.get('studentName')?.value).toBe(mockStudent.displayName);
      expect(component.createMissionForm.get('document')?.hasValidator(Validators.required)).toBeTrue();
    });

    it('should fetch and correctly populate tutors for the student', fakeAsync(() => {
        let tutors: IPopulatedUser[] = [];
        component.tutors$.subscribe(t => tutors = t);
        tick();
        expect(bundleServiceSpy.getBundles).toHaveBeenCalled();
        expect(tutors.length).toBe(1);
        expect(tutors[0]._id).toBe(mockTutor._id);
    }));

    it('should not save if form is invalid', () => {
        component.onSave();
        expect(missionServiceSpy.createMission).not.toHaveBeenCalled();
    });

    it('should successfully upload file and create a mission', fakeAsync(() => {
        const file = new File([''], 'test.pdf');
        component.onFileSelected(file);
        component.createMissionForm.patchValue({
            tutorId: mockTutor._id,
            dateCompleted: new Date(),
            remuneration: 100,
        });

        fileServiceSpy.getPresignedUploadUrl.and.returnValue(of({ url: 'signed-url', fileKey: 'file-key' }));
        fileServiceSpy.uploadFileToSignedUrl.and.returnValue(of({}));
        fileServiceSpy.finalizeUpload.and.returnValue(of(mockDocument));
        missionServiceSpy.createMission.and.returnValue(of(mockMission));

        component.onSave();
        tick();

        expect(fileServiceSpy.getPresignedUploadUrl).toHaveBeenCalledWith(file.name, file.type);
        expect(missionServiceSpy.createMission).toHaveBeenCalled();
        expect(snackBarServiceSpy.showSuccess).toHaveBeenCalledWith('Mission created successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockMission);
    }));

    it('should handle error during mission creation', fakeAsync(() => {
        const file = new File([''], 'test.pdf');
        component.onFileSelected(file);
        component.createMissionForm.patchValue({ tutorId: mockTutor._id, dateCompleted: new Date(), remuneration: 100 });
        
        fileServiceSpy.getPresignedUploadUrl.and.returnValue(of({ url: 'signed-url', fileKey: 'file-key' }));
        fileServiceSpy.uploadFileToSignedUrl.and.returnValue(of({}));
        fileServiceSpy.finalizeUpload.and.returnValue(of(mockDocument));
        missionServiceSpy.createMission.and.returnValue(throwError(() => ({ error: { message: 'Creation Failed' } })));
        
        component.onSave();
        tick();

        expect(snackBarServiceSpy.showError).toHaveBeenCalledWith('Creation Failed');
        expect(component.isSaving).toBeFalse();
    }));
  });

  // --- EDIT MODE TESTS ---
  describe('Edit Mode', () => {
    beforeEach(fakeAsync(() => {
      setupTestBed({ student: mockStudent, mission: mockMission, bundleId: 'bundle1' });
    }));

    it('should initialize form in edit mode and patch values', () => {
        expect(component.isEditMode).toBeTrue();
        expect(component.createMissionForm.get('tutorId')?.value).toBe(mockTutor._id);
        expect(component.createMissionForm.get('remuneration')?.value).toBe(mockMission.remuneration);
        expect(component.createMissionForm.get('document')?.hasValidator(Validators.required)).toBeFalse();
    });
    
    it('should successfully update a mission', fakeAsync(() => {
        component.createMissionForm.patchValue({
            remuneration: 200,
            status: EMissionStatus.Completed
        });
        
        const updatedMission = { ...mockMission, remuneration: 200, status: EMissionStatus.Completed };
        missionServiceSpy.updateMission.and.returnValue(of(updatedMission));

        component.onSave();
        tick();

        expect(missionServiceSpy.updateMission).toHaveBeenCalledWith(mockMission._id, jasmine.any(Object));
        const payload = missionServiceSpy.updateMission.calls.mostRecent().args[1];
        expect(payload.remuneration).toBe(200);
        expect(snackBarServiceSpy.showSuccess).toHaveBeenCalledWith('Mission updated successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(updatedMission);
    }));

    it('should handle error on mission update', fakeAsync(() => {
        const errorResponse = { error: { message: 'Update Failed' } };
        missionServiceSpy.updateMission.and.returnValue(throwError(() => errorResponse));

        component.onSave();
        tick();

        expect(missionServiceSpy.updateMission).toHaveBeenCalled();
        expect(snackBarServiceSpy.showError).toHaveBeenCalledWith('Update Failed');
        expect(component.isSaving).toBeFalse();
    }));
  });
});


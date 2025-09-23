import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CreateEditBundleModal } from './create-edit-bundle-modal';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { UserService } from '../../../../../services/user-service';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IBundle } from '../../../../../models/interfaces/IBundle.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

// --- MOCK DATA ---
const mockStudent: IUser = { _id: 'student1', displayName: 'Jane Smith', type: EUserType.Client } as IUser;
const mockTutor: IUser = { _id: 'tutor1', displayName: 'John Doe', type: EUserType.Staff } as IUser;
const mockSubject: ISubject = { _id: 'subj1', name: 'Mathematics', grades: ['10', '11'] };
const mockProficiency: IProficiency = {
  _id: 'prof1', name: 'Cambridge', subjects: { 'math': mockSubject }
};
const mockBundle: IBundle = {
    _id: '1',
    student: { _id: 'student1', displayName: 'Jane Smith' },
    subjects: [
      { _id: 'sub1', subject: 'Math', grade: '10', tutor: { _id: 't1', displayName: 'Tutor A' }, durationMinutes: 60 }
    ],
    creator: 'c1',
    status: EBundleStatus.Pending,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

describe('CreateEditBundleModal', () => {
  let component: CreateEditBundleModal;
  let fixture: ComponentFixture<CreateEditBundleModal>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let userServiceSpy: { allUsers$: BehaviorSubject<IUser[]>, fetchAllUsers: jasmine.Spy };
  let proficiencyServiceSpy: { allProficiencies$: BehaviorSubject<IProficiency[]>, fetchAllProficiencies: jasmine.Spy };
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateEditBundleModal>>;

  const setupTestBed = async (data: any) => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['createBundle', 'updateBundle']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);
    
    userServiceSpy = {
        allUsers$: new BehaviorSubject<IUser[]>([mockStudent, mockTutor]),
        fetchAllUsers: jasmine.createSpy('fetchAllUsers').and.returnValue(of([mockStudent, mockTutor]))
    };
    proficiencyServiceSpy = {
        allProficiencies$: new BehaviorSubject<IProficiency[]>([mockProficiency]),
        fetchAllProficiencies: jasmine.createSpy('fetchAllProficiencies').and.returnValue(of([mockProficiency]))
    };

    await TestBed.configureTestingModule({
        imports: [CreateEditBundleModal, NoopAnimationsModule],
        providers: [
            { provide: BundleService, useValue: bundleServiceSpy },
            { provide: SnackBarService, useValue: snackbarServiceSpy },
            { provide: UserService, useValue: userServiceSpy },
            { provide: ProficiencyService, useValue: proficiencyServiceSpy },
            { provide: MatDialogRef, useValue: dialogRefSpy },
            { provide: MAT_DIALOG_DATA, useValue: data }
        ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateEditBundleModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await setupTestBed({});
    });

    it('should call createBundle with the correct payload when form is valid', fakeAsync(() => {
        bundleServiceSpy.createBundle.and.returnValue(of(mockBundle));
        tick();

        component.bundleForm.get('student')?.setValue(mockStudent._id);
        component.studentNameCtrl.setValue(mockStudent.displayName);

        const subjectGroup = component.subjects.at(0);
        subjectGroup.get('proficiencyName')?.setValue(mockProficiency);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockSubject);
        subjectGroup.get('grade')?.setValue('10');
        subjectGroup.get('tutorName')?.setValue(mockTutor);
        subjectGroup.get('tutor')?.setValue(mockTutor._id);

        expect(component.bundleForm.valid).toBeTrue();

        component.onSave();
        tick();

        expect(bundleServiceSpy.createBundle).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle created successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockBundle);
    }));

    it('should show error if createBundle fails', fakeAsync(() => {
      bundleServiceSpy.createBundle.and.returnValue(throwError(() => new Error('Error')));
      tick();

      component.bundleForm.get('student')?.setValue(mockStudent._id);
      component.studentNameCtrl.setValue(mockStudent.displayName);

      const subjectGroup = component.subjects.at(0);
      subjectGroup.get('proficiencyName')?.setValue(mockProficiency);
      subjectGroup.get('proficiency')?.setValue(mockProficiency);
      subjectGroup.get('subjectName')?.setValue(mockSubject);
      subjectGroup.get('grade')?.setValue('10');
      subjectGroup.get('tutorName')?.setValue(mockTutor);
      subjectGroup.get('tutor')?.setValue(mockTutor._id);

      component.onSave();
      tick();

      expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });
  
  describe('Edit Mode', () => {
      beforeEach(async () => {
          await setupTestBed({ bundle: mockBundle });
      });

      it('should initialize in edit mode', () => {
          expect(component.isEditMode).toBeTrue();
      });

      it('should call updateBundle when saving in edit mode', fakeAsync(() => {
        bundleServiceSpy.updateBundle.and.returnValue(of(mockBundle));
        tick();
  
        const subjectGroup = component.subjects.at(0);
        subjectGroup.get('proficiencyName')?.setValue(mockProficiency);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockSubject);
        subjectGroup.get('grade')?.setValue('10');
        subjectGroup.get('tutorName')?.setValue(mockTutor);
        subjectGroup.get('tutor')?.setValue(mockTutor._id);
  
        component.onSave();
        tick();
  
        expect(bundleServiceSpy.updateBundle).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle updated and set to pending for review.');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockBundle);
      }));

      it('should show error if updateBundle fails', fakeAsync(() => {
        bundleServiceSpy.updateBundle.and.returnValue(throwError(() => new Error('Error')));
        tick();

        const subjectGroup = component.subjects.at(0);
        subjectGroup.get('proficiencyName')?.setValue(mockProficiency);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockSubject);
        subjectGroup.get('grade')?.setValue('10');
        subjectGroup.get('tutorName')?.setValue(mockTutor);
        subjectGroup.get('tutor')?.setValue(mockTutor._id);
  
        component.onSave();
        tick();
  
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      }));
  });

  describe('Form Controls and Interactions', () => {
    beforeEach(async () => {
      await setupTestBed({});
    });

    it('should add and remove subject groups', () => {
      expect(component.subjects.length).toBe(1);
      component.addSubject();
      expect(component.subjects.length).toBe(2);
      component.removeSubject(1);
      expect(component.subjects.length).toBe(1);
    });

    it('should not save if form is invalid', () => {
      component.onSave();
      expect(bundleServiceSpy.createBundle).not.toHaveBeenCalled();
      expect(bundleServiceSpy.updateBundle).not.toHaveBeenCalled();
    });

    it('should close dialog on cancel', () => {
      component.onCancel();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});
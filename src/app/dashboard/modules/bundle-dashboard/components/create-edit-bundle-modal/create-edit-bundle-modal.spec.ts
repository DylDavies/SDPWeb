import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
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
    createdBy: 'c1',
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
        imports: [CreateEditBundleModal, NoopAnimationsModule, HttpClientTestingModule],
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

        expect(bundleServiceSpy.createBundle).toHaveBeenCalledWith(
          mockStudent._id,
          jasmine.any(Array),
          undefined,
          undefined,
          []
        );
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle created successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockBundle);
    }));

    it('should call createBundle with all optional fields when provided', fakeAsync(() => {
        bundleServiceSpy.createBundle.and.returnValue(of(mockBundle));
        tick();

        const mockAddress = {
          streetAddress: '101 Library Room',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
          formattedAddress: '101 Library Room, New York, NY 10001, USA'
        };

        component.bundleForm.get('student')?.setValue(mockStudent._id);
        component.bundleForm.get('lessonLocation')?.setValue(mockAddress);
        component.bundleForm.get('manager')?.setValue('manager-123');
        component.bundleForm.get('stakeholders')?.setValue(['stakeholder-1', 'stakeholder-2']);
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

        expect(bundleServiceSpy.createBundle).toHaveBeenCalledWith(
          mockStudent._id,
          jasmine.any(Array),
          mockAddress,
          'manager-123',
          ['stakeholder-1', 'stakeholder-2']
        );
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

        expect(bundleServiceSpy.updateBundle).toHaveBeenCalledWith(
          mockBundle._id,
          jasmine.objectContaining({
            subjects: jasmine.any(Array),
            status: EBundleStatus.Pending
          })
        );
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle updated and set to pending for review.');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockBundle);
      }));

      it('should call updateBundle with new optional fields', fakeAsync(() => {
        bundleServiceSpy.updateBundle.and.returnValue(of(mockBundle));
        tick();

        const mockAddress = {
          streetAddress: '200 New Location',
          city: 'Boston',
          state: 'MA',
          postalCode: '02101',
          country: 'USA',
          formattedAddress: '200 New Location, Boston, MA 02101, USA'
        };

        component.bundleForm.get('lessonLocation')?.setValue(mockAddress);
        component.bundleForm.get('manager')?.setValue('new-manager-123');
        component.bundleForm.get('stakeholders')?.setValue(['new-stakeholder-1']);

        const subjectGroup = component.subjects.at(0);
        subjectGroup.get('proficiencyName')?.setValue(mockProficiency);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockSubject);
        subjectGroup.get('grade')?.setValue('10');
        subjectGroup.get('tutorName')?.setValue(mockTutor);
        subjectGroup.get('tutor')?.setValue(mockTutor._id);

        component.onSave();
        tick();

        expect(bundleServiceSpy.updateBundle).toHaveBeenCalledWith(
          mockBundle._id,
          jasmine.objectContaining({
            lessonLocation: mockAddress,
            manager: 'new-manager-123',
            stakeholders: ['new-stakeholder-1']
          })
        );
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

    it('should add stakeholder to selectedStakeholders', () => {
      const newStakeholder: any = { _id: 'stakeholder-1', displayName: 'Stakeholder One' };
      const event = { option: { value: newStakeholder } } as any;

      component.onStakeholderSelected(event);

      expect(component.selectedStakeholders.length).toBe(1);
      expect(component.selectedStakeholders[0]).toEqual(newStakeholder);
    });

    it('should remove stakeholder from selectedStakeholders', () => {
      const stakeholder: any = { _id: 'stakeholder-1', displayName: 'Stakeholder One' };
      component.selectedStakeholders = [stakeholder];
      component.bundleForm.get('stakeholders')?.setValue([stakeholder._id]);

      component.removeStakeholder(stakeholder);

      expect(component.selectedStakeholders.length).toBe(0);
    });

    it('should set manager when selected', () => {
      const manager: any = { _id: 'manager-1', displayName: 'Manager One' };
      const event = { option: { value: manager } } as any;

      component.onManagerSelected(event);

      expect(component.bundleForm.get('manager')?.value).toBe(manager._id);
    });

    it('should handle tutor selection and run validation', () => {
      const tutor: any = { _id: 'tutor-1', displayName: 'Tutor One' };
      const event = { option: { value: tutor } } as any;

      component.onTutorSelected(event, 0);

      expect(component.subjects.at(0).get('tutor')?.value).toBe(tutor._id);
    });

    it('should handle proficiency selection', () => {
      const prof: any = { _id: 'prof-1', name: 'Cambridge' };
      const event = { option: { value: prof } } as any;

      component.onProficiencySelected(event, 0);

      expect(component.subjects.at(0).get('proficiency')?.value).toEqual(prof);
    });

    it('should handle subject selection and run validation', () => {
      const subject: any = { _id: 'subj-1', name: 'Mathematics', grades: ['10'] };
      const event = { option: { value: subject } } as any;

      component.onSubjectSelected(event, 0);

      expect(component.subjects.at(0).get('subjectName')?.value).toEqual(subject);
    });

    it('should display user correctly', () => {
      const user: any = { _id: 'user-1', displayName: 'Test User' };
      expect(component.displayUser(user)).toBe('Test User');
    });

    it('should display empty string for null user', () => {
      expect(component.displayUser(null)).toBe('');
    });

    it('should display proficiency name', () => {
      const prof: any = { name: 'Cambridge' };
      expect(component.displayProf(prof)).toBe('Cambridge');
    });

    it('should display subject name', () => {
      const subject: any = { name: 'Mathematics' };
      expect(component.displaySubject(subject)).toBe('Mathematics');
    });

    it('should handle address selection', () => {
      const address: any = {
        streetAddress: '123 Main St',
        city: 'New York',
        formattedAddress: '123 Main St, New York'
      };

      component.onAddressSelected(address);

      expect(component.bundleForm.get('lessonLocation')?.value).toEqual(address);
    });

    it('should handle undefined address selection', () => {
      component.onAddressSelected(undefined);

      expect(component.bundleForm.get('lessonLocation')?.value).toBeUndefined();
    });

    it('should not save when validation error exists', () => {
      component.validationError = 'Duplicate tutor-subject combination';
      component.bundleForm.patchValue({ student: 'student-1' });

      component.onSave();

      expect(bundleServiceSpy.createBundle).not.toHaveBeenCalled();
      expect(bundleServiceSpy.updateBundle).not.toHaveBeenCalled();
    });

    it('should not save when already saving', () => {
      component.isSaving = true;
      component.bundleForm.patchValue({ student: 'student-1' });

      component.onSave();

      expect(bundleServiceSpy.createBundle).not.toHaveBeenCalled();
      expect(bundleServiceSpy.updateBundle).not.toHaveBeenCalled();
    });

    it('should validate and find duplicate tutor-subject combinations', fakeAsync(() => {
      bundleServiceSpy.createBundle.and.returnValue(of(mockBundle));
      tick();

      const subjectGroup1 = component.subjects.at(0);
      subjectGroup1.get('proficiencyName')?.setValue(mockProficiency);
      subjectGroup1.get('proficiency')?.setValue(mockProficiency);
      subjectGroup1.get('subjectName')?.setValue(mockSubject);
      subjectGroup1.get('tutor')?.setValue(mockTutor._id);
      subjectGroup1.get('tutorName')?.setValue(mockTutor);

      component.addSubject();
      tick();

      const subjectGroup2 = component.subjects.at(1);
      subjectGroup2.get('proficiencyName')?.setValue(mockProficiency);
      subjectGroup2.get('proficiency')?.setValue(mockProficiency);
      subjectGroup2.get('subjectName')?.setValue(mockSubject);
      subjectGroup2.get('tutor')?.setValue(mockTutor._id);
      subjectGroup2.get('tutorName')?.setValue(mockTutor);

      const error = component['validateNoDuplicateTutorSubjects']();

      expect(error).toContain('Duplicate tutor-subject combination');
      expect(error).toContain('Mathematics');
    }));

    it('should return null when no duplicates exist', () => {
      const subjectGroup1 = component.subjects.at(0);
      subjectGroup1.get('tutor')?.setValue('tutor-1');
      subjectGroup1.get('subjectName')?.setValue({ name: 'Mathematics' });

      component.addSubject();

      const subjectGroup2 = component.subjects.at(1);
      subjectGroup2.get('tutor')?.setValue('tutor-2');
      subjectGroup2.get('subjectName')?.setValue({ name: 'Science' });

      const error = component['validateNoDuplicateTutorSubjects']();

      expect(error).toBeNull();
    });

    it('should skip validation for subjects without tutor or subject', () => {
      const subjectGroup = component.subjects.at(0);
      subjectGroup.get('tutor')?.setValue('');
      subjectGroup.get('subjectName')?.setValue(null);

      const error = component['validateNoDuplicateTutorSubjects']();

      expect(error).toBeNull();
    });
  });
});
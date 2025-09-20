import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { EditBundleModal } from './edit-bundle-modal';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { UserService } from '../../../../../services/user-service';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IBundle, IBundleSubject, IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';

// --- MOCK DATA ---
const mockTutor: IUser = { _id: 'tutor1', displayName: 'John Doe', type: EUserType.Staff } as IUser;
const mockStudent: IPopulatedUser = { _id: 'student1', displayName: 'Jane Smith' };
const mockProficiency: IProficiency = {
  _id: 'prof1', name: 'Cambridge', subjects: {
    math: { _id: 'subj1', name: 'Mathematics', grades: ['10', '11'] },
    phys: { _id: 'subj2', name: 'Physics', grades: ['12'] }
  }
};
const mockBundleSubject: IBundleSubject = {
    _id: 'bs1',
    subject: 'Mathematics',
    grade: '10',
    tutor: mockTutor,
    hours: 5
};
const mockBundleData: IBundle = {
  _id: 'bundle123',
  student: mockStudent,
  subjects: [mockBundleSubject],
  creator: 'creator123',
  status: EBundleStatus.Pending,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// --- MOCK SERVICES ---
const bundleServiceSpy = jasmine.createSpyObj('BundleService', ['updateBundle']);
const snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
const userServiceSpy = {
  allUsers$: new BehaviorSubject<IUser[]>([mockTutor]),
  fetchAllUsers: jasmine.createSpy('fetchAllUsers').and.returnValue(of([mockTutor]))
};
const proficiencyServiceSpy = {
  allProficiencies$: new BehaviorSubject<IProficiency[]>([mockProficiency]),
  fetchAllProficiencies: jasmine.createSpy('fetchAllProficiencies').and.returnValue(of([mockProficiency]))
};
const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);


describe('EditBundleModal', () => {
  let component: EditBundleModal;
  let fixture: ComponentFixture<EditBundleModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditBundleModal, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ProficiencyService, useValue: proficiencyServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        // Provide default data, which can be overridden in specific tests
        { provide: MAT_DIALOG_DATA, useValue: mockBundleData }
      ]
    }).compileComponents();

    // Reset spies before each test
    bundleServiceSpy.updateBundle.calls.reset();
    snackbarServiceSpy.showSuccess.calls.reset();
    snackbarServiceSpy.showError.calls.reset();
    userServiceSpy.fetchAllUsers.calls.reset();
    proficiencyServiceSpy.fetchAllProficiencies.calls.reset();
    dialogRefSpy.close.calls.reset();
  });

  // Helper function to create the component for each test
  const createComponent = () => {
    fixture = TestBed.createComponent(EditBundleModal);
    component = fixture.componentInstance;
  };

  it('should create and initialize the form with data', fakeAsync(() => {
    createComponent();
    fixture.detectChanges(); // ngOnInit
    tick(); // allow observables to resolve
    fixture.detectChanges();

    expect(component).toBeTruthy();
    expect(userServiceSpy.fetchAllUsers).toHaveBeenCalled();
    expect(proficiencyServiceSpy.fetchAllProficiencies).toHaveBeenCalled();
    expect(component.subjects.length).toBe(1);
    expect(component.subjects.at(0).value.tutorName).toEqual(mockTutor);
    expect(component.subjects.at(0).value.subjectName).toEqual(mockProficiency.subjects['math']);
  }));

  it('should initialize correctly when a subject match is not found', fakeAsync(() => {
      const bundleWithUnmatchedSubject = { ...mockBundleData, subjects: [{ ...mockBundleSubject, subject: 'Unknown Subject' }] };
      // Override the provider for this specific test case
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: bundleWithUnmatchedSubject });
      
      createComponent();
      fixture.detectChanges();
      tick();
      expect(component.subjects.at(0).get('proficiencyName')?.value).toBeFalsy();
  }));

  it('should handle initialization when tutor is a string ID', fakeAsync(() => {
      const bundleWithTutorId = { ...mockBundleData, subjects: [{ ...mockBundleSubject, tutor: 'tutor1' }] };
      TestBed.overrideProvider(MAT_DIALOG_DATA, { useValue: bundleWithTutorId });
      
      createComponent();
      fixture.detectChanges();
      tick();
      expect(component.subjects.at(0).get('tutor')?.value).toBe('');
      expect(component.subjects.at(0).get('tutorName')?.value).toBe('');
  }));


  it('should add and remove a subject from the form', () => {
    createComponent();
    fixture.detectChanges();
    component.addSubject();
    expect(component.subjects.length).toBe(2);
    component.removeSubject(1);
    expect(component.subjects.length).toBe(1);
  });
  
  it('should handle autocomplete display functions', () => {
    createComponent();
    fixture.detectChanges();
    expect(component.displayUser(mockTutor)).toBe('John Doe');
    expect(component.displayUser(null as any)).toBe('');
    expect(component.displayProf(mockProficiency)).toBe('Cambridge');
    expect(component.displayProf(null as any)).toBe('');
    expect(component.displaySubject(mockProficiency.subjects['math'])).toBe('Mathematics');
    expect(component.displaySubject(null as any)).toBe('');
  });

  it('should handle autocomplete selection events', () => {
      createComponent();
      fixture.detectChanges();
      component.addSubject(); // Add a new empty subject group at index 1

      const tutorEvent = { option: { value: mockTutor } } as MatAutocompleteSelectedEvent;
      component.onTutorSelected(tutorEvent, 1);
      expect(component.subjects.at(1).get('tutor')?.value).toBe(mockTutor._id);

      const profEvent = { option: { value: mockProficiency } } as MatAutocompleteSelectedEvent;
      component.onProficiencySelected(profEvent, 1);
      expect(component.subjects.at(1).get('proficiency')?.value).toBe(mockProficiency);

      const subjectEvent = { option: { value: mockProficiency.subjects['math'] } } as MatAutocompleteSelectedEvent;
      component.onSubjectSelected(subjectEvent, 1);
      expect(component.subjects.at(1).get('subjectName')?.value).toBe(mockProficiency.subjects['math']);
  });

  describe('Form Control Logic', () => {
    beforeEach(fakeAsync(() => {
        createComponent();
        fixture.detectChanges();
        component.addSubject(); // Add a new empty subject group at index 1
        tick();
    }));

    it('should enable/disable form controls based on selections', fakeAsync(() => {
        const subjectGroup = component.subjects.at(1);
        expect(subjectGroup.get('subjectName')?.disabled).toBeTrue();
        expect(subjectGroup.get('grade')?.disabled).toBeTrue();

        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        tick();
        expect(subjectGroup.get('subjectName')?.enabled).toBeTrue();
        expect(subjectGroup.get('grade')?.disabled).toBeTrue();

        subjectGroup.get('subjectName')?.setValue(mockProficiency.subjects['math']);
        tick();
        expect(subjectGroup.get('grade')?.enabled).toBeTrue();
    }));

    it('should clear proficiency when proficiency name is cleared', fakeAsync(() => {
        const subjectGroup = component.subjects.at(1);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('proficiencyName')?.setValue('');
        tick();
        expect(subjectGroup.get('proficiency')?.value).toBeNull();
    }));

     it('should reset subject and grade when proficiency is cleared', fakeAsync(() => {
        const subjectGroup = component.subjects.at(1);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockProficiency.subjects['math']);
        subjectGroup.get('grade')?.setValue('10');
        tick();
        
        subjectGroup.get('proficiency')?.setValue(null);
        tick();

        expect(subjectGroup.get('subjectName')?.value).toBe('');
        expect(subjectGroup.get('grade')?.value).toBe('');
        expect(subjectGroup.get('subjectName')?.disabled).toBeTrue();
    }));

    it('should reset grade when subject is cleared', fakeAsync(() => {
        const subjectGroup = component.subjects.at(1);
        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('subjectName')?.setValue(mockProficiency.subjects['math']);
        subjectGroup.get('grade')?.setValue('10');
        tick();
        
        subjectGroup.get('subjectName')?.setValue(''); // Clear by typing
        tick();

        expect(subjectGroup.get('grade')?.value).toBe('');
        expect(subjectGroup.get('grade')?.disabled).toBeTrue();
    }));
  });

  describe('onSave', () => {
    beforeEach(() => {
        createComponent();
        fixture.detectChanges();
    });

    it('should not save if the form is invalid', () => {
      component.subjects.at(0).get('tutorName')?.setValue(''); // Make form invalid
      component.onSave();
      expect(bundleServiceSpy.updateBundle).not.toHaveBeenCalled();
    });

    it('should not save if already saving', () => {
        component.isSaving = true;
        component.onSave();
        expect(bundleServiceSpy.updateBundle).not.toHaveBeenCalled();
    });

    it('should call updateBundle with the correct payload on success', fakeAsync(() => {
        bundleServiceSpy.updateBundle.and.returnValue(of(mockBundleData));
        tick();

        component.onSave();
        tick();

        expect(component.isSaving).toBeTrue();
        expect(bundleServiceSpy.updateBundle).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle updated and set to pending for review.');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockBundleData);
    }));

    it('should handle errors on save and use fallback message', fakeAsync(() => {
        // Test error without a specific message property
        bundleServiceSpy.updateBundle.and.returnValue(throwError(() => ({ error: {} })));
        tick();

        component.onSave();
        tick();

        expect(component.isSaving).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to update bundle.');
        expect(dialogRefSpy.close).not.toHaveBeenCalled();
    }));
  });

  it('should close the dialog onCancel', () => {
    createComponent();
    fixture.detectChanges();
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });

   it('should get student name or fallback', () => {
    createComponent();
    fixture.detectChanges();
    expect(component.getStudentName()).toBe('Jane Smith');
    component.data.student = 'studentId'; // Simulate non-populated user
    expect(component.getStudentName()).toBe('a Student');
  });
});


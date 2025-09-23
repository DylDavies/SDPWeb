import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogRef } from '@angular/material/dialog';
import { ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { CreateBundleModal } from './create-bundle-modal';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { UserService } from '../../../../../services/user-service';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

const mockStudent: IUser = { _id: 'student1', displayName: 'Jane Smith', type: EUserType.Client } as IUser;
const mockTutor: IUser = { _id: 'tutor1', displayName: 'John Doe', type: EUserType.Staff } as IUser;
const mockProficiency: IProficiency = {
  _id: 'prof1', name: 'Cambridge', subjects: {
    math: { _id: 'subj1', name: 'Mathematics', grades: ['10', '11'] }
  }
};

let bundleServiceSpy: jasmine.SpyObj<BundleService>;
let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
let userServiceSpy: { allUsers$: BehaviorSubject<IUser[]>, fetchAllUsers: jasmine.Spy };
let proficiencyServiceSpy: { allProficiencies$: BehaviorSubject<IProficiency[]>, fetchAllProficiencies: jasmine.Spy };
let dialogRefSpy: jasmine.SpyObj<MatDialogRef<CreateBundleModal>>;

describe('CreateBundleModal', () => {
  let component: CreateBundleModal;
  let fixture: ComponentFixture<CreateBundleModal>;

  beforeEach(async () => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['createBundle']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    userServiceSpy = {
      allUsers$: new BehaviorSubject<IUser[]>([mockStudent, mockTutor]),
      fetchAllUsers: jasmine.createSpy('fetchAllUsers').and.returnValue(of([mockStudent, mockTutor]))
    };
    proficiencyServiceSpy = {
      allProficiencies$: new BehaviorSubject<IProficiency[]>([mockProficiency]),
      fetchAllProficiencies: jasmine.createSpy('fetchAllProficiencies').and.returnValue(of([mockProficiency]))
    };
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [CreateBundleModal, NoopAnimationsModule, ReactiveFormsModule],
      providers: [
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: ProficiencyService, useValue: proficiencyServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(CreateBundleModal);
    component = fixture.componentInstance;
  });

  it('should create and initialize with one subject', fakeAsync(() => {
    fixture.detectChanges(); // ngOnInit
    tick();
    expect(component).toBeTruthy();
    expect(userServiceSpy.fetchAllUsers).toHaveBeenCalled();
    expect(proficiencyServiceSpy.fetchAllProficiencies).toHaveBeenCalled();
    expect(component.subjects.length).toBe(1);
  }));

  it('should add and remove subjects from the form', () => {
    fixture.detectChanges();
    component.addSubject();
    expect(component.subjects.length).toBe(2);
    component.removeSubject(1);
    expect(component.subjects.length).toBe(1);
  });
  
  it('should handle autocomplete display functions correctly', () => {
    expect(component.displayUser(mockTutor)).toBe('John Doe');
    expect(component.displayUser(null as any)).toBe('');
    expect(component.displayProf(mockProficiency)).toBe('Cambridge');
    expect(component.displayProf(null as any)).toBe('');
    expect(component.displaySubject(mockProficiency.subjects['math'])).toBe('Mathematics');
    expect(component.displaySubject(null as any)).toBe('');
  });

  it('should handle all autocomplete selection events', () => {
      fixture.detectChanges();
      
      const studentEvent = { option: { value: mockStudent } } as MatAutocompleteSelectedEvent;
      component.onStudentSelected(studentEvent);
      expect(component.createBundleForm.get('student')?.value).toBe(mockStudent._id);

      const tutorEvent = { option: { value: mockTutor } } as MatAutocompleteSelectedEvent;
      component.onTutorSelected(tutorEvent, 0);
      expect(component.subjects.at(0).get('tutor')?.value).toBe(mockTutor._id);

      const profEvent = { option: { value: mockProficiency } } as MatAutocompleteSelectedEvent;
      component.onProficiencySelected(profEvent, 0);
      expect(component.subjects.at(0).get('proficiency')?.value).toBe(mockProficiency);

      const subjectEvent = { option: { value: mockProficiency.subjects['math'] } } as MatAutocompleteSelectedEvent;
      component.onSubjectSelected(subjectEvent, 0);
      expect(component.subjects.at(0).get('subjectName')?.value).toBe(mockProficiency.subjects['math']);
  });

  describe('Reactive Form Logic', () => {
    it('should filter users based on type and search value', fakeAsync(() => {
        fixture.detectChanges();
        let filteredStudents: IUser[] = [];
        component.filteredStudents$.subscribe(students => filteredStudents = students);
        
        tick();
        expect(filteredStudents.length).toBe(1);
        expect(filteredStudents[0].type).toBe(EUserType.Client);

        component.studentNameCtrl.setValue('jane');
        tick();
        expect(filteredStudents.length).toBe(1);

        component.studentNameCtrl.setValue('nonexistent');
        tick();
        expect(filteredStudents.length).toBe(0);

        (component.studentNameCtrl as any).setValue(mockStudent);
        tick();
        expect(filteredStudents.length).toBe(1);
    }));

    it('should enable/disable dependent form controls correctly', fakeAsync(() => {
        fixture.detectChanges();
        const subjectGroup = component.subjects.at(0);
        
        expect(subjectGroup.get('subjectName')?.disabled).toBeTrue();
        expect(subjectGroup.get('grade')?.disabled).toBeTrue();

        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        tick();
        expect(subjectGroup.get('subjectName')?.enabled).toBeTrue();

        subjectGroup.get('subjectName')?.setValue(mockProficiency.subjects['math']);
        tick();
        expect(subjectGroup.get('grade')?.enabled).toBeTrue();

        subjectGroup.get('proficiencyName')?.setValue('');
        tick();
        expect(subjectGroup.get('proficiency')?.value).toBeNull();
        expect(subjectGroup.get('subjectName')?.disabled).toBeTrue();
        expect(subjectGroup.get('grade')?.disabled).toBeTrue();
    }));
  });

  describe('onCreate', () => {
    beforeEach(() => {
        fixture.detectChanges();
        component.createBundleForm.get('student')?.setValue(mockStudent._id);
        component.studentNameCtrl.setValue(mockStudent.displayName); 

        const subjectGroup = component.subjects.at(0);
        subjectGroup.get('tutor')?.setValue(mockTutor._id);
        subjectGroup.get('tutorName')?.setValue(mockTutor.displayName); 

        subjectGroup.get('proficiency')?.setValue(mockProficiency);
        subjectGroup.get('proficiencyName')?.setValue(mockProficiency.name); 

        subjectGroup.get('subjectName')?.setValue(mockProficiency.subjects['math']);
        subjectGroup.get('grade')?.setValue('10');
    });

    it('should not save if the form is invalid', () => {
      component.createBundleForm.get('student')?.setValue('');
      component.onCreate();
      expect(bundleServiceSpy.createBundle).not.toHaveBeenCalled();
    });

    it('should not save if already saving', () => {
        component.isSaving = true;
        component.onCreate();
        expect(bundleServiceSpy.createBundle).not.toHaveBeenCalled();
    });

    it('should call createBundle with the correct payload on success', fakeAsync(() => {
        bundleServiceSpy.createBundle.and.returnValue(of({} as any));
        component.onCreate();
        tick();

        expect(component.isSaving).toBeTrue();
        const expectedPayload = {
            subject: 'Mathematics',
            grade: '10',
            tutor: 'tutor1',
            hours: 1
        };
        expect(bundleServiceSpy.createBundle).toHaveBeenCalledWith(mockStudent._id, [jasmine.objectContaining(expectedPayload)]);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Bundle created successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalled();
    }));

    it('should handle errors on save and use fallback message', fakeAsync(() => {
        bundleServiceSpy.createBundle.and.returnValue(throwError(() => ({ error: {} })));
        component.onCreate();
        tick();

        expect(component.isSaving).toBeFalse();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Failed to create bundle.');
    }));
    
    it('should handle errors on save with a specific error message', fakeAsync(() => {
        bundleServiceSpy.createBundle.and.returnValue(throwError(() => ({ error: { message: 'Server Error' } })));
        component.onCreate();
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Server Error');
    }));
  });

  it('should close the dialog onCancel', () => {
    fixture.detectChanges();
    component.onCancel();
    expect(dialogRefSpy.close).toHaveBeenCalled();
  });
});
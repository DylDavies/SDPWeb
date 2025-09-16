import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { of, throwError, BehaviorSubject, Subject } from 'rxjs';

import { ProficiencyManagement } from './proficiency-management';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { AuthService } from '../../../../../services/auth-service';
import { UserService } from '../../../../../services/user-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';

// --- MOCK DATA ---
const mockSubjectMath: ISubject = { _id: 'subj1', name: 'Mathematics', grades: ['10', '11', '12'] };
const mockSubjectPhys: ISubject = { _id: 'subj2', name: 'Physics', grades: ['11', '12'] };
const mockSubjectArt: ISubject = { _id: 'subj3', name: 'Art', grades: [] }; // Subject with grades array
// FIX: Added the required 'grades' property to satisfy the ISubject interface.
const mockSubjectMusic: ISubject = { _id: 'subj4', name: 'Music', grades: [] }; // Subject without grades property

const mockProficiency: IProficiency = {
  _id: 'prof1', name: 'Cambridge', subjects: {
    mathematics: mockSubjectMath,
    physics: mockSubjectPhys,
    art: mockSubjectArt,
    music: mockSubjectMusic
  }
};
const mockUserProficiency: IProficiency = {
    name: 'Cambridge',
    subjects: {
        mathematics: { name: 'Mathematics', grades: ['10'] } as ISubject
    }
};
const mockUser: IUser = {
  _id: 'user123',
  displayName: 'Test User',
  proficiencies: [mockUserProficiency]
} as IUser;


// --- MOCK SERVICES ---
let authServiceSpy: { currentUser$: BehaviorSubject<IUser | null>, updateCurrentUserState: jasmine.Spy };
let proficiencyServiceSpy: { fetchAllProficiencies: jasmine.Spy };
let userServiceSpy: { deleteSubjectFromProficiency: jasmine.Spy, updateUserProficiency: jasmine.Spy };
let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
let matDialogSpy: jasmine.SpyObj<MatDialog>;


describe('ProficiencyManagement', () => {
  let component: ProficiencyManagement;
  let fixture: ComponentFixture<ProficiencyManagement>;

  beforeEach(async () => {
    // Re-initialize spies before each test to ensure they are clean
    authServiceSpy = {
        currentUser$: new BehaviorSubject<IUser | null>(null),
        updateCurrentUserState: jasmine.createSpy('updateCurrentUserState')
    };
    proficiencyServiceSpy = {
        fetchAllProficiencies: jasmine.createSpy('fetchAllProficiencies').and.returnValue(of([mockProficiency]))
    };
    userServiceSpy = {
        deleteSubjectFromProficiency: jasmine.createSpy('deleteSubjectFromProficiency').and.returnValue(of(mockUser)),
        updateUserProficiency: jasmine.createSpy('updateUserProficiency').and.returnValue(of(mockUser))
    };
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError', 'showInfo']);
    matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ProficiencyManagement, NoopAnimationsModule],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ProficiencyService, useValue: proficiencyServiceSpy },
        { provide: UserService, useValue: userServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ]
    })
    .overrideComponent(ProficiencyManagement, {
        remove: { imports: [MatDialogModule] },
        add: {}
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProficiencyManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  
  describe('Initialization', () => {
    it('should initialize with user and proficiency data', fakeAsync(() => {
        authServiceSpy.currentUser$.next(mockUser);
        fixture.detectChanges(); // ngOnInit
        tick();
        
        expect(component.user).toEqual(mockUser);
        expect(component.userProficiencies.length).toBe(1);
        expect(proficiencyServiceSpy.fetchAllProficiencies).toHaveBeenCalled();
        expect(component.proficiencies.length).toBe(1);
        expect(component.selectedSyllabus).toBe('Cambridge');
    }));

     it('should handle initialization with no existing user proficiencies', fakeAsync(() => {
        const userWithoutProficiencies = { ...mockUser, proficiencies: [] };
        authServiceSpy.currentUser$.next(userWithoutProficiencies);
        fixture.detectChanges();
        tick();
        expect(component.userProficiencies.length).toBe(0);
        expect(component.selectedUserSyllabus).toBeNull();
    }));

     it('should handle errors during initialization', () => {
        const consoleErrorSpy = spyOn(console, 'error');
        authServiceSpy.currentUser$.next(mockUser);
        proficiencyServiceSpy.fetchAllProficiencies.and.returnValue(throwError(() => new Error('API down')));
        fixture.detectChanges();
        expect(consoleErrorSpy).toHaveBeenCalled();
     });

     it('should handle initialization when there is no logged-in user', fakeAsync(() => {
        authServiceSpy.currentUser$.next(null);
        fixture.detectChanges();
        tick();
        expect(component.user).toBeNull();
        expect(proficiencyServiceSpy.fetchAllProficiencies).not.toHaveBeenCalled();
     }));
  });

  describe('User Proficiencies (View) Tab', () => {
    beforeEach(fakeAsync(() => {
        authServiceSpy.currentUser$.next(mockUser);
        fixture.detectChanges();
        tick();
    }));

    it('should select a user syllabus and display its subjects', () => {
        component.onUserSyllabusSelect('Cambridge');
        expect(component.selectedUserSyllabus).toBe('Cambridge');
        expect(component.selectedUserSyllabusSubjects.length).toBe(1);
        expect(component.selectedUserSyllabusSubjects[0].name).toBe('Mathematics');
    });

    it('should do nothing if a non-existent user syllabus is selected', () => {
        component.onUserSyllabusSelect('Non-Existent');
        expect(component.selectedUserSyllabus).not.toBe('Non-Existent');
    });

    it('should handle deleting a subject with confirmation', fakeAsync(() => {
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
        component.deleteSubject('Cambridge', mockSubjectMath);
        tick();

        expect(userServiceSpy.deleteSubjectFromProficiency).toHaveBeenCalledWith('user123', 'Cambridge', 'subj1');
        expect(authServiceSpy.updateCurrentUserState).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

     it('should not delete a subject if confirmation is cancelled', () => {
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) } as any);
        component.deleteSubject('Cambridge', mockSubjectMath);
        expect(userServiceSpy.deleteSubjectFromProficiency).not.toHaveBeenCalled();
    });

    it('should show an error if deleting a subject fails', fakeAsync(() => {
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
        userServiceSpy.deleteSubjectFromProficiency.and.returnValue(throwError(() => new Error('API Error')));
        component.deleteSubject('Cambridge', mockSubjectMath);
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));

    it('should show error and not call dialog if subject has no _id', () => {
        const subjectWithoutId = { name: 'Bad Subject' } as ISubject;
        component.deleteSubject('Cambridge', subjectWithoutId);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot delete subject without a valid ID.');
        expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should return an empty string for grades if grades property is missing', () => {
        expect(component.getGradeNames(mockSubjectMusic)).toBe('');
    });
  });
  
  describe('Edit Proficiencies Tab', () => {
    beforeEach(fakeAsync(() => {
        authServiceSpy.currentUser$.next(mockUser);
        fixture.detectChanges();
        tick();
    }));

    it('should add a subject via autocomplete and select it for editing', () => {
        component.onSyllabusSelect('Cambridge');
        const event = { option: { value: 'Physics' } } as MatAutocompleteSelectedEvent;
        component.onAutocompleteSelected(event);

        expect(component.selectedSubjects).toContain('Physics');
        expect(component.selectedSubject).toBe('Physics');
        expect(component.availableGrades).toEqual(['11', '12']);
    });

    it('should remove a subject that is NOT the currently selected subject', () => {
        component.onSyllabusSelect('Cambridge');
        // Add two subjects
        component.onAutocompleteSelected({ option: { value: 'Physics' } } as MatAutocompleteSelectedEvent);
        component.onAutocompleteSelected({ option: { value: 'Mathematics' } } as MatAutocompleteSelectedEvent);

        // Select 'Mathematics' for editing
        component.onChipClick('Mathematics');
        expect(component.selectedSubject).toBe('Mathematics');
        
        // Remove 'Physics'
        component.removeSubject('Physics');
        expect(component.selectedSubjects).not.toContain('Physics');
        // The selected subject should remain 'Mathematics'
        expect(component.selectedSubject).toBe('Mathematics');
    });

    it('should add selected grades to a subject', () => {
        component.onSyllabusSelect('Cambridge');
        const event = { option: { value: 'Physics' } } as MatAutocompleteSelectedEvent;
        component.onAutocompleteSelected(event);

        component.selectedGrades = ['12'];
        component.addSubjectWithGrades();

        expect(component.syllabusSelections['Cambridge']['Physics']).toEqual(['12']);
        expect(component.selectedSubject).toBeNull();
    });

    it('should handle selecting a syllabus that does not exist', () => {
        component.onSyllabusSelect('Non-Existent');
        expect(component.availableSubjects).toEqual([]);
    });

    it('should clear input without refocusing', () => {
        component.subjectInput = { nativeElement: { value: 'test', focus: jasmine.createSpy('focus') } } as any;
        // @ts-expect-error - Accessing private method for test
        component.clearInput(false);
        expect(component.subjectInput.nativeElement.focus).not.toHaveBeenCalled();
    });
  });

  describe('confirmSave', () => {
    beforeEach(fakeAsync(() => {
        authServiceSpy.currentUser$.next(mockUser);
        fixture.detectChanges();
        tick();
    }));

    it('should not run if user is not available', () => {
        component.user = null;
        component.confirmSave();
        expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should show info snackbar if there are no changes to save', () => {
        component.confirmSave();
        expect(snackbarServiceSpy.showInfo).toHaveBeenCalledWith("No changes to save.");
    });

    it('should save changes after confirmation', fakeAsync(() => {
        component.onSyllabusSelect('Cambridge');
        component.onAutocompleteSelected({ option: { value: 'Physics' } } as MatAutocompleteSelectedEvent);
        component.selectedGrades = ['12'];
        component.addSubjectWithGrades();
        
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
        
        component.confirmSave();
        tick();

        expect(userServiceSpy.updateUserProficiency).toHaveBeenCalled();
        expect(authServiceSpy.updateCurrentUserState).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

     it('should show an error if saving fails', fakeAsync(() => {
        component.onSyllabusSelect('Cambridge');
        component.onAutocompleteSelected({ option: { value: 'Physics' } } as MatAutocompleteSelectedEvent);
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
        userServiceSpy.updateUserProficiency.and.returnValue(throwError(() => new Error()));
        
        component.confirmSave();
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('An error occurred while saving.');
    }));

    it('should show an error if the final updated user is null', fakeAsync(() => {
        component.onSyllabusSelect('Cambridge');
        component.onAutocompleteSelected({ option: { value: 'Physics' } } as MatAutocompleteSelectedEvent);
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) } as any);
        userServiceSpy.updateUserProficiency.and.returnValue(of(null));
        
        component.confirmSave();
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Could not confirm proficiency updates.');
    }));
  });
});


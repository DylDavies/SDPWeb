import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectionListChange, MatListOption } from '@angular/material/list';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { AdminProficiencyManagement } from './admin-proficiency-management';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { EditNameDialog } from '../edit-name-dialog/edit-name-dialog';
import { AdminSubjectEditDialog } from '../admin-subject-edit-dialog/admin-subject-edit-dialog';

// Mock data
const mockSubject: ISubject = { _id: 'subj1', name: 'Mathematics', grades: ['10', '11'] };
const mockProficiency: IProficiency = {
  _id: 'prof1',
  name: 'Cambridge',
  subjects: { mathematics: mockSubject }
};

// Mock Services
const proficiencyServiceSpy = {
  allProficiencies$: new BehaviorSubject<IProficiency[]>([]),
  fetchAllProficiencies: jasmine.createSpy('fetchAllProficiencies').and.returnValue(of([mockProficiency])),
  addOrUpdateProficiency: jasmine.createSpy('addOrUpdateProficiency').and.returnValue(of(mockProficiency)),
  updateProficiencyName: jasmine.createSpy('updateProficiencyName').and.returnValue(of(mockProficiency)),
  deleteProficiency: jasmine.createSpy('deleteProficiency').and.returnValue(of(null)),
  addOrUpdateSubject: jasmine.createSpy('addOrUpdateSubject').and.returnValue(of(mockProficiency)),
  deleteSubject: jasmine.createSpy('deleteSubject').and.returnValue(of(mockProficiency)),
};

const snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
const matDialogSpy = jasmine.createSpyObj('MatDialog', ['open']);


describe('AdminProficiencyManagement', () => {
  let component: AdminProficiencyManagement;
  let fixture: ComponentFixture<AdminProficiencyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProficiencyManagement, NoopAnimationsModule],
      providers: [
        { provide: ProficiencyService, useValue: proficiencyServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminProficiencyManagement);
    component = fixture.componentInstance;
    
    // Reset spies before each test
    Object.values(proficiencyServiceSpy).forEach(spy => {
        if (typeof spy === 'function' && 'calls' in spy) {
            (spy as jasmine.Spy).calls.reset();
        }
    });
    snackbarServiceSpy.showSuccess.calls.reset();
    snackbarServiceSpy.showError.calls.reset();
    matDialogSpy.open.calls.reset();
    
    proficiencyServiceSpy.updateProficiencyName.and.returnValue(of(mockProficiency));
    proficiencyServiceSpy.deleteSubject.and.returnValue(of(mockProficiency));
    
    // Set initial data for the observable
    proficiencyServiceSpy.allProficiencies$.next([mockProficiency]);

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should fetch all proficiencies on init', () => {
    expect(proficiencyServiceSpy.fetchAllProficiencies).toHaveBeenCalled();
  });

  it('should select a proficiency and update the data source', () => {
    const event = new MatSelectionListChange(null as any, [ { value: mockProficiency } as MatListOption ]);
    component.onProficiencySelected(event);
    expect(component.selectedProficiency).toEqual(mockProficiency);
    expect(component.dataSource.data).toEqual([mockSubject]);
  });

  describe('addProficiency', () => {
    it('should not add proficiency if the name is empty', () => {
      component.newProficiencyName = '   ';
      component.addProficiency();
      expect(proficiencyServiceSpy.addOrUpdateProficiency).not.toHaveBeenCalled();
    });

    it('should add a new proficiency and show a success message', fakeAsync(() => {
      component.newProficiencyName = 'New Syllabus';
      component.addProficiency();
      tick(); // Flush the observable
      expect(proficiencyServiceSpy.addOrUpdateProficiency).toHaveBeenCalledWith({ name: 'New Syllabus', subjects: {} });
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
      expect(component.newProficiencyName).toBe('');
    }));
  });

  describe('editProficiencyName', () => {
    it('should not do anything if no proficiency is selected', () => {
      component.selectedProficiency = null;
      component.editProficiencyName();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('should open a dialog and update the name on success', fakeAsync(() => {
      component.selectedProficiency = mockProficiency;
      matDialogSpy.open.and.returnValue({ afterClosed: () => of('Updated Name') });
      
      component.editProficiencyName();
      tick(); // Flush observables from dialog and service
      
      expect(matDialogSpy.open).toHaveBeenCalledWith(EditNameDialog, jasmine.any(Object));
      expect(proficiencyServiceSpy.updateProficiencyName).toHaveBeenCalledWith(mockProficiency._id!, 'Updated Name');
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should show an error if updating the name fails', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        matDialogSpy.open.and.returnValue({ afterClosed: () => of('Updated Name') });
        proficiencyServiceSpy.updateProficiencyName.and.returnValue(throwError(() => new Error()));

        component.editProficiencyName();
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('deleteProficiency', () => {
    it('should delete a proficiency after confirmation', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) }); // User confirms

        component.deleteProficiency();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalledWith(ConfirmationDialog, jasmine.any(Object));
        expect(proficiencyServiceSpy.deleteProficiency).toHaveBeenCalledWith(mockProficiency._id!);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
        expect(component.selectedProficiency).toBeNull();
    }));

    it('should not delete if confirmation is cancelled', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(false) }); // User cancels

        component.deleteProficiency();
        tick();
        expect(proficiencyServiceSpy.deleteProficiency).not.toHaveBeenCalled();
    }));
  });

  describe('openSubjectDialog', () => {
    it('should open a dialog to add a new subject', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        const newSubject = { name: 'Physics', grades: ['12'] };
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(newSubject) });

        component.openSubjectDialog();
        tick();

        expect(matDialogSpy.open).toHaveBeenCalledWith(AdminSubjectEditDialog, jasmine.objectContaining({ data: { subject: undefined } }));
        expect(proficiencyServiceSpy.addOrUpdateSubject).toHaveBeenCalledWith(mockProficiency._id!, newSubject);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Subject added.');
    }));

     it('should open a dialog to edit an existing subject', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        const updatedSubject = { ...mockSubject, name: 'Advanced Math' };
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(updatedSubject) });
        
        component.openSubjectDialog(mockSubject);
        tick();

        expect(matDialogSpy.open).toHaveBeenCalledWith(AdminSubjectEditDialog, jasmine.objectContaining({ data: { subject: mockSubject } }));
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Subject updated.');
    }));
  });

  describe('deleteSubject', () => {
    it('should delete a subject after confirmation', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });

        component.deleteSubject(mockSubject);
        tick();

        expect(proficiencyServiceSpy.deleteSubject).toHaveBeenCalledWith(mockProficiency._id!, 'mathematics');
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalled();
    }));

    it('should show an error if deleting a subject fails', fakeAsync(() => {
        component.selectedProficiency = mockProficiency;
        matDialogSpy.open.and.returnValue({ afterClosed: () => of(true) });
        proficiencyServiceSpy.deleteSubject.and.returnValue(throwError(() => new Error()));

        component.deleteSubject(mockSubject);
        tick();
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

});


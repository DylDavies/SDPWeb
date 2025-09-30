import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { MatChipInputEvent } from '@angular/material/chips';

import { AdminSubjectEditDialog } from './admin-subject-edit-dialog';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';

// --- MOCK DATA ---
const mockSubject: ISubject = {
  _id: 'subject-123',
  name: 'Mathematics',
  grades: ['Grade 10', 'Grade 11']
};

describe('AdminSubjectEditDialog', () => {
  let component: AdminSubjectEditDialog;
  let fixture: ComponentFixture<AdminSubjectEditDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<AdminSubjectEditDialog>>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;
  let mockLiveAnnouncer: jasmine.SpyObj<LiveAnnouncer>;

  // Helper to setup the component with different MAT_DIALOG_DATA
  const setupComponent = (data: any) => {
    TestBed.configureTestingModule({
      imports: [AdminSubjectEditDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: jasmine.createSpyObj('MatDialogRef', ['close']) },
        { provide: SnackBarService, useValue: jasmine.createSpyObj('SnackBarService', ['showInfo']) },
        { provide: LiveAnnouncer, useValue: jasmine.createSpyObj('LiveAnnouncer', ['announce']) },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AdminSubjectEditDialog);
    component = fixture.componentInstance;
    mockDialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<AdminSubjectEditDialog>>;
    mockSnackbarService = TestBed.inject(SnackBarService) as jasmine.SpyObj<SnackBarService>;
    mockLiveAnnouncer = TestBed.inject(LiveAnnouncer) as jasmine.SpyObj<LiveAnnouncer>;
    fixture.detectChanges();
  };

  describe('Create Mode', () => {
    beforeEach(() => {
      setupComponent({}); // No subject data provided for create mode
    });

    it('should create in create mode', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeFalse();
      expect(component.form.get('name')?.value).toBe('');
      expect(component.grades.length).toBe(0);
    });
  });

  describe('Edit Mode', () => {
    beforeEach(() => {
      setupComponent({ subject: mockSubject }); // Subject data provided for edit mode
    });

    it('should create in edit mode and populate form', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeTrue();
      expect(component.form.get('name')?.value).toBe('Mathematics');
      expect(component.grades).toEqual(['Grade 10', 'Grade 11']);
    });
  });

  // Tests applicable to both modes
  describe('Shared Logic', () => {
    beforeEach(() => {
      setupComponent({ subject: mockSubject });
    });

    it('should invalidate the form if the name is empty', () => {
      component.form.get('name')?.setValue('');
      expect(component.form.invalid).toBeTrue();
    });

    it('should not close the dialog on save if the form is invalid', () => {
      component.form.get('name')?.setValue('');
      component.onSave();
      expect(mockDialogRef.close).not.toHaveBeenCalled();
    });

    it('should close the dialog with the correct data on save when form is valid', () => {
      component.form.get('name')?.setValue('New Subject Name');
      component.grades = ['New Grade'];
      component.onSave();
      
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        name: 'New Subject Name',
        grades: ['New Grade'],
        _id: 'subject-123'
      });
    });

    it('should close the dialog on cancel', () => {
      component.onCancel();
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    describe('Grade Management', () => {
      it('should add a new grade', () => {
        const event = { value: 'Grade 12', chipInput: { clear: () => {} } } as MatChipInputEvent;
        component.addGrade(event);
        expect(component.grades).toContain('Grade 12');
        expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Added Grade 12');
      });

      it('should trim whitespace when adding a new grade', () => {
        const event = { value: '  Grade 9 ', chipInput: { clear: () => {} } } as MatChipInputEvent;
        component.addGrade(event);
        expect(component.grades).toContain('Grade 9');
      });

      it('should not add a duplicate grade and should show a snackbar', () => {
        const event = { value: 'Grade 10', chipInput: { clear: () => {} } } as MatChipInputEvent;
        component.addGrade(event);
        expect(component.grades.length).toBe(2); // Still the original two
        expect(mockSnackbarService.showInfo).toHaveBeenCalledWith('Grade "Grade 10" has already been added.');
      });

      it('should not add an empty or whitespace-only grade', () => {
        const event = { value: '  ', chipInput: { clear: () => {} } } as MatChipInputEvent;
        component.addGrade(event);
        expect(component.grades.length).toBe(2);
      });
      
      it('should remove an existing grade', () => {
        component.removeGrade('Grade 10');
        expect(component.grades).not.toContain('Grade 10');
        expect(component.grades.length).toBe(1);
        expect(mockLiveAnnouncer.announce).toHaveBeenCalledWith('Removed Grade 10');
      });

      it('should do nothing if trying to remove a non-existent grade', () => {
        component.removeGrade('Non-existent Grade');
        expect(component.grades.length).toBe(2);
        expect(mockLiveAnnouncer.announce).not.toHaveBeenCalledWith('Removed Non-existent Grade');
      });
    });
  });
});
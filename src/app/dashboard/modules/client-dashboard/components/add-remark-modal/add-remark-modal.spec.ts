import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { AddRemarkModal } from './add-remark-modal';
import { RemarkService } from '../../../../../services/remark-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IRemark, IRemarkTemplate } from '../../../../../models/interfaces/IRemark.interface';

// --- MOCK DATA ---
const mockEvent: IEvent = {
  _id: 'event1',
  bundle: 'bundle1', // FIX: Added the required 'bundle' property
  subject: 'Mathematics',
  startTime: new Date(),
  student: { _id: 'student1', displayName: 'Test Student' },
  tutor: { _id: 'tutor1', displayName: 'Test Tutor' },
  duration: 60,
  remarked: false,
  remark: ''
};

const mockTemplate: IRemarkTemplate = {
  _id: 'template1',
  name: 'Default Template',
  isActive: true,
  fields: [
    { name: 'Overall Feedback', type: 'string' },
    { name: 'Punctuality', type: 'boolean' },
    { name: 'Session Start Time', type: 'time' }
  ]
};

const mockRemark: IRemark = {
    _id: 'remark1',
    event: 'event1',
    template: mockTemplate,
    remarkedAt: new Date(),
    entries: [
        { field: 'Overall Feedback', value: 'Good session' },
        { field: 'Punctuality', value: true },
        { field: 'Session Start Time', value: '10:00' }
    ]
};


describe('AddRemarkModal', () => {
  let component: AddRemarkModal;
  let fixture: ComponentFixture<AddRemarkModal>;
  let remarkServiceSpy: jasmine.SpyObj<RemarkService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddRemarkModal>>;

  const setupTestBed = async (data: any) => {
    remarkServiceSpy = jasmine.createSpyObj('RemarkService', ['getActiveTemplate', 'createRemark', 'updateRemark']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddRemarkModal, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: RemarkService, useValue: remarkServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddRemarkModal);
    component = fixture.componentInstance;
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ event: mockEvent });
      remarkServiceSpy.getActiveTemplate.and.returnValue(of(mockTemplate));
      fixture.detectChanges();
    });

    it('should create and fetch the active template', () => {
      expect(component).toBeTruthy();
      expect(remarkServiceSpy.getActiveTemplate).toHaveBeenCalled();
      expect(component.template).toEqual(mockTemplate);
    });

    it('should call createRemark on save', fakeAsync(() => {
        remarkServiceSpy.createRemark.and.returnValue(of(mockRemark));
        component.remarkForm.setValue({
            'Overall Feedback': 'Excellent',
            'Punctuality': true,
            'Session Start Time': '09:00'
        });
        
        component.onSave();
        tick();

        expect(remarkServiceSpy.createRemark).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Remark saved successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should show error if createRemark fails', fakeAsync(() => {
        remarkServiceSpy.createRemark.and.returnValue(throwError(() => new Error('Error')));
        component.remarkForm.setValue({
            'Overall Feedback': 'Excellent',
            'Punctuality': true,
            'Session Start Time': '09:00'
        });
        
        component.onSave();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ event: mockEvent, remark: mockRemark });
      fixture.detectChanges();
    });

    it('should initialize in edit mode without fetching template', () => {
      expect(component.isEditMode).toBeTrue();
      expect(remarkServiceSpy.getActiveTemplate).not.toHaveBeenCalled();
      expect(component.remarkForm.value['Overall Feedback']).toBe('Good session');
    });

    it('should call updateRemark on save', fakeAsync(() => {
        remarkServiceSpy.updateRemark.and.returnValue(of(mockRemark));
        component.remarkForm.get('Overall Feedback')?.setValue('Even better session');
        
        component.onSave();
        tick();

        expect(remarkServiceSpy.updateRemark).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Remark saved successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
    }));

    it('should show error if updateRemark fails', fakeAsync(() => {
        remarkServiceSpy.updateRemark.and.returnValue(throwError(() => new Error('Error')));
        component.remarkForm.get('Overall Feedback')?.setValue('Even better session');
        
        component.onSave();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
    }));
  });

  describe('General Logic', () => {
    beforeEach(async () => {
        await setupTestBed({ event: mockEvent });
        remarkServiceSpy.getActiveTemplate.and.returnValue(of(mockTemplate));
        fixture.detectChanges();
      });

    it('should not save if form is invalid', () => {
        component.onSave();
        expect(remarkServiceSpy.createRemark).not.toHaveBeenCalled();
        expect(remarkServiceSpy.updateRemark).not.toHaveBeenCalled();
    });

    it('should close dialog on cancel', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});
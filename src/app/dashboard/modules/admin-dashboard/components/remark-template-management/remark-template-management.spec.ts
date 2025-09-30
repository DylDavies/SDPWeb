import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { of, throwError } from 'rxjs';
import * as _ from 'lodash';

import { RemarkTemplateManagement } from './remark-template-management';
import { RemarkService } from '../../../../../services/remark-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IRemarkTemplate, IRemarkField } from '../../../../../models/interfaces/IRemark.interface';

// --- MOCK DATA ---
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

describe('RemarkTemplateManagement', () => {
  let component: RemarkTemplateManagement;
  let fixture: ComponentFixture<RemarkTemplateManagement>;
  let remarkServiceSpy: jasmine.SpyObj<RemarkService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;

  beforeEach(async () => {
    remarkServiceSpy = jasmine.createSpyObj('RemarkService', ['getActiveTemplate', 'updateTemplate']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);

    await TestBed.configureTestingModule({
      imports: [RemarkTemplateManagement, NoopAnimationsModule, FormsModule],
      providers: [
        { provide: RemarkService, useValue: remarkServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RemarkTemplateManagement);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization', () => {
    it('should load the active template on init', fakeAsync(() => {
      remarkServiceSpy.getActiveTemplate.and.returnValue(of(mockTemplate));
      
      fixture.detectChanges(); // ngOnInit
      tick();

      expect(remarkServiceSpy.getActiveTemplate).toHaveBeenCalled();
      expect(component.template).toEqual(mockTemplate);
      expect(component.fields.length).toBe(3);
      expect(component.isSaveDisabled()).toBeTrue(); // Initially, no changes
    }));

    it('should handle the case where no active template exists', fakeAsync(() => {
        remarkServiceSpy.getActiveTemplate.and.returnValue(of(null as any));
        
        fixture.detectChanges();
        tick();
  
        expect(component.template).toBeNull();
        expect(component.fields.length).toBe(0);
      }));
  });

  describe('Field Manipulation', () => {
    beforeEach(fakeAsync(() => {
        remarkServiceSpy.getActiveTemplate.and.returnValue(of(mockTemplate));
        fixture.detectChanges();
        tick();
    }));

    it('should add a new field', () => {
        component.newFieldName = 'New Field';
        component.newFieldType = 'number';
        component.addField();
        
        expect(component.fields.length).toBe(4);
        expect(component.fields[3]).toEqual({ name: 'New Field', type: 'number' });
        expect(component.newFieldName).toBe('');
        expect(component.isSaveDisabled()).toBeFalse();
    });

    it('should not add a field with an empty name', () => {
        component.newFieldName = '  ';
        component.addField();
        expect(component.fields.length).toBe(3);
    });

    it('should show an error if adding a duplicate field name', () => {
        component.newFieldName = 'Punctuality';
        component.addField();
        expect(component.fields.length).toBe(3);
        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Field "Punctuality" already exists.');
      });

    it('should remove a field', () => {
        const fieldToRemove = component.fields[1]; // Punctuality
        component.removeField(fieldToRemove);
        
        expect(component.fields.length).toBe(2);
        expect(component.fields.some(f => f.name === 'Punctuality')).toBeFalse();
        expect(component.isSaveDisabled()).toBeFalse();
    });

    it('should reorder fields on drop', () => {
        const event = {
          previousIndex: 0,
          currentIndex: 2,
        } as CdkDragDrop<IRemarkField[]>;

        const originalFirstField = component.fields[0];
        component.drop(event);

        expect(component.fields[2].name).toBe(originalFirstField.name);
        expect(component.isSaveDisabled()).toBeFalse();
    });
  });

  describe('Save Logic', () => {
    beforeEach(fakeAsync(() => {
        remarkServiceSpy.getActiveTemplate.and.returnValue(of(mockTemplate));
        fixture.detectChanges();
        tick();
    }));

    it('should call updateTemplate on saveChanges and reload on success', fakeAsync(() => {
        remarkServiceSpy.updateTemplate.and.returnValue(of(mockTemplate));
        component.addField(); // Make a change

        component.saveChanges();
        tick();

        expect(remarkServiceSpy.updateTemplate).toHaveBeenCalledWith(component.fields);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('New remark template version created successfully!');
        expect(remarkServiceSpy.getActiveTemplate).toHaveBeenCalledTimes(2); // Initial load + reload
    }));

    it('should show an error if saveChanges fails', fakeAsync(() => {
        const errorResponse = { error: { message: 'Update failed' } };
        remarkServiceSpy.updateTemplate.and.returnValue(throwError(() => errorResponse));
        component.addField();

        component.saveChanges();
        tick();

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Update failed');
    }));

    it('should not attempt to save if template is null', () => {
        component.template = null;
        component.saveChanges();
        expect(remarkServiceSpy.updateTemplate).not.toHaveBeenCalled();
    });
  });
});

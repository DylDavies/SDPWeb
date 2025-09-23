import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError } from 'rxjs';
import { AddEventModal } from './add-event-modal';
import { BundleService } from '../../../../../services/bundle-service';
import { EventService } from '../../../../../services/event-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { IBundle } from '../../../../../models/interfaces/IBundle.interface';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';

// MOCK DATA
const mockBundle: IBundle = {
    _id: 'bundle1',
    student: { _id: 'student1', displayName: 'Test Student' },
    subjects: [
        { _id: 'subject1', subject: 'Math', grade: '10', tutor: 'tutor1', durationMinutes: 120 },
    ],
    creator: 'creator1',
    status: EBundleStatus.Approved,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
};

const mockEvent: IEvent = {
    _id: 'event1',
    bundle: 'bundle1',
    student: { _id: 'student1', displayName: 'Test Student' },
    tutor: { _id: 'tutor1', displayName: 'Test Tutor' },
    subject: 'Math',
    startTime: new Date(),
    duration: 60,
    remarked: false,
    remark: ''
};

describe('AddEventModal', () => {
  let component: AddEventModal;
  let fixture: ComponentFixture<AddEventModal>;
  let bundleServiceSpy: jasmine.SpyObj<BundleService>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddEventModal>>;

  const setupTestBed = async (data: any) => {
    bundleServiceSpy = jasmine.createSpyObj('BundleService', ['getBundles']);
    eventServiceSpy = jasmine.createSpyObj('EventService', ['getEvents', 'createEvent', 'updateEvent']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddEventModal, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: BundleService, useValue: bundleServiceSpy },
        { provide: EventService, useValue: eventServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    bundleServiceSpy.getBundles.and.returnValue(of([mockBundle]));
    eventServiceSpy.getEvents.and.returnValue(of([mockEvent]));

    fixture = TestBed.createComponent(AddEventModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Create Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ date: new Date() });
    });

    it('should create and initialize form', () => {
      expect(component).toBeTruthy();
      expect(component.isEditMode).toBeFalse();
    });

    it('should call createEvent on save', fakeAsync(() => {
      eventServiceSpy.createEvent.and.returnValue(of(mockEvent));
      component.eventForm.setValue({
        bundle: mockBundle,
        subject: 'Math',
        startTime: '10:00',
        duration: 60
      });

      component.onSave();
      tick();

      expect(eventServiceSpy.createEvent).toHaveBeenCalled();
      expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Event created successfully!');
      expect(dialogRefSpy.close).toHaveBeenCalledWith(mockEvent);
    }));

    it('should show error if createEvent fails', fakeAsync(() => {
        eventServiceSpy.createEvent.and.returnValue(throwError(() => new Error('Error')));
        component.eventForm.setValue({
          bundle: mockBundle,
          subject: 'Math',
          startTime: '10:00',
          duration: 60
        });
  
        component.onSave();
        tick();
  
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      }));
  });

  describe('Edit Mode', () => {
    beforeEach(async () => {
      await setupTestBed({ date: new Date(), event: mockEvent });
    });

    it('should initialize in edit mode and patch form', () => {
      expect(component.isEditMode).toBeTrue();
      expect(component.eventForm.get('bundle')?.value).toEqual(mockBundle);
    });

    it('should call updateEvent on save', fakeAsync(() => {
        eventServiceSpy.updateEvent.and.returnValue(of(mockEvent));
        component.eventForm.get('startTime')?.setValue('11:00');
        component.eventForm.get('duration')?.setValue(90);
  
        component.onSave();
        tick();
  
        expect(eventServiceSpy.updateEvent).toHaveBeenCalled();
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Event updated successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(mockEvent);
      }));

      it('should show error if updateEvent fails', fakeAsync(() => {
        eventServiceSpy.updateEvent.and.returnValue(throwError(() => new Error('Error')));
        component.eventForm.get('startTime')?.setValue('11:00');
        component.eventForm.get('duration')?.setValue(90);
  
        component.onSave();
        tick();
  
        expect(snackbarServiceSpy.showError).toHaveBeenCalled();
      }));
  });

  describe('Form Logic', () => {
    beforeEach(async () => {
        await setupTestBed({ date: new Date() });
      });

    it('should not save if form is invalid', () => {
        component.onSave();
        expect(eventServiceSpy.createEvent).not.toHaveBeenCalled();
        expect(eventServiceSpy.updateEvent).not.toHaveBeenCalled();
    });

    it('should close dialog on cancel', () => {
        component.onCancel();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { of, throwError, BehaviorSubject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { RemarkModal } from './remark-modal';
import { EventService } from '../../../../../services/event-service';
import { RemarkService } from '../../../../../services/remark-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AuthService } from '../../../../../services/auth-service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { AddEventModal } from '../add-event-modal/add-event-modal';
import { AddRemarkModal } from '../add-remark-modal/add-remark-modal';

import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { IRemark } from '../../../../../models/interfaces/IRemark.interface';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { HttpClientTestingModule } from '@angular/common/http/testing';

// --- MOCK DATA ---
const mockClientUser: IUser = { _id: 'client1', type: EUserType.Client } as IUser;
const mockStaffUser: IUser = { _id: 'staff1', type: EUserType.Staff } as IUser;

const mockPastEvent: IEvent = {
  _id: 'event1',
  bundle: 'bundle1',
  subject: 'Mathematics',
  startTime: new Date(Date.now() - 86400000), // Yesterday
  student: { _id: 'student1', displayName: 'Test Student' },
  tutor: { _id: 'tutor1', displayName: 'Test Tutor' },
  duration: 60,
  remarked: false,
  remark: ''
};

const mockRemarkedEvent: IEvent = { ...mockPastEvent, _id: 'event2', remarked: true, remark: 'remark1' };

const mockRemark: IRemark = {
    _id: 'remark1',
    event: 'event2',
    template: { _id: 't1', name: 'Default', fields: [], isActive: true },
    remarkedAt: new Date(),
    entries: []
};


describe('RemarkModal', () => {
  let component: RemarkModal;
  let fixture: ComponentFixture<RemarkModal>;
  let eventServiceSpy: jasmine.SpyObj<EventService>;
  let remarkServiceSpy: jasmine.SpyObj<RemarkService>;
  let snackbarServiceSpy: jasmine.SpyObj<SnackBarService>;
  let authServiceSpy: { currentUser$: BehaviorSubject<IUser | null> };
  let dialog: MatDialog;
  let dialogSpy: jasmine.Spy;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<RemarkModal>>;

  const setupTestBed = async (data: { event: IEvent }, currentUser: IUser) => {
    eventServiceSpy = jasmine.createSpyObj('EventService', ['deleteEvent', 'rateEvent']);
    remarkServiceSpy = jasmine.createSpyObj('RemarkService', ['getRemarkForEvent']);
    snackbarServiceSpy = jasmine.createSpyObj('SnackBarService', ['showSuccess', 'showError']);
    authServiceSpy = { currentUser$: new BehaviorSubject<IUser | null>(currentUser) };
    dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [RemarkModal, NoopAnimationsModule, HttpClientTestingModule, MatDialogModule],
      providers: [
        { provide: EventService, useValue: eventServiceSpy },
        { provide: RemarkService, useValue: remarkServiceSpy },
        { provide: SnackBarService, useValue: snackbarServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RemarkModal);
    component = fixture.componentInstance;
    // Get the MatDialog instance directly from the component's injector
    // to ensure we are spying on the exact same instance the component uses.
    dialog = fixture.debugElement.injector.get(MatDialog);
    dialogSpy = spyOn(dialog, 'open');
    fixture.detectChanges();
  };

  describe('As a Client User', () => {
    beforeEach(async () => {
        await setupTestBed({ event: mockPastEvent }, mockClientUser);
    });

    it('should initialize correctly for a client', () => {
        expect(component.isStudent).toBeTrue();
        expect(component.isPastEvent).toBeTrue();
    });

    it('should call rateEvent and close dialog on successful rating', () => {
        const updatedEvent = { ...mockPastEvent, rating: 5 };
        eventServiceSpy.rateEvent.and.returnValue(of(updatedEvent));
        
        component.rateEvent(5);

        expect(eventServiceSpy.rateEvent).toHaveBeenCalledWith(mockPastEvent._id, 5);
        expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Event rated successfully!');
        expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
        expect(component.rating).toBe(5);
    });

    it('should show an error if rating fails', () => {
        eventServiceSpy.rateEvent.and.returnValue(throwError(() => ({ error: { message: 'Rating failed' } })));
        
        component.rateEvent(4);

        expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Rating failed');
    });

    it('should not allow rating if the event is already rated', () => {
        component.rating = 3;
        component.rateEvent(5);
        expect(eventServiceSpy.rateEvent).not.toHaveBeenCalled();
    });
  });

  describe('As a Staff/Admin User', () => {
    beforeEach(async () => {
        await setupTestBed({ event: mockPastEvent }, mockStaffUser);
    });

    it('should initialize correctly for a staff member', () => {
        expect(component.isStudent).toBeFalse();
    });

    describe('onDelete', () => {
        it('should show an error if trying to delete a remarked event', () => {
            component.isRemarked = true;
            component.onDelete();
            expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot delete a remarked event.');
            expect(dialogSpy).not.toHaveBeenCalled();
        });

        it('should open confirmation, delete event, and close on success', fakeAsync(() => {
            dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);
            eventServiceSpy.deleteEvent.and.returnValue(of(void 0));
            
            component.onDelete();
            tick();

            expect(dialogSpy).toHaveBeenCalledWith(ConfirmationDialog, jasmine.any(Object));
            expect(eventServiceSpy.deleteEvent).toHaveBeenCalledWith(mockPastEvent._id);
            expect(snackbarServiceSpy.showSuccess).toHaveBeenCalledWith('Event deleted successfully!');
            expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
        }));

        it('should not delete if confirmation is cancelled', () => {
            dialogSpy.and.returnValue({ afterClosed: () => of(false) } as any);
            component.onDelete();
            expect(eventServiceSpy.deleteEvent).not.toHaveBeenCalled();
        });
    });

    describe('onEdit', () => {
        it('should show an error if trying to edit a remarked event', () => {
            component.isRemarked = true;
            component.onEdit();
            expect(snackbarServiceSpy.showError).toHaveBeenCalledWith('Cannot edit a remarked event.');
            expect(dialogSpy).not.toHaveBeenCalled();
        });

        it('should open the AddEventModal and close if it returns a result', () => {
            dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);
            component.onEdit();
            expect(dialogSpy).toHaveBeenCalledWith(AddEventModal, jasmine.any(Object));
            expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
        });
    });

    describe('addOrEditRemark', () => {
        it('should open AddRemarkModal without remark data for an unremarked event', () => {
            dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);
            component.isRemarked = false;
            
            component.addOrEditRemark();

            expect(dialogSpy).toHaveBeenCalledWith(AddRemarkModal, jasmine.objectContaining({
                data: { event: mockPastEvent, remark: undefined }
            }));
            expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
        });

        it('should fetch remark and open AddRemarkModal with remark data for a remarked event', fakeAsync(() => {
            dialogSpy.and.returnValue({ afterClosed: () => of(true) } as any);
            remarkServiceSpy.getRemarkForEvent.and.returnValue(of(mockRemark));
            component.isRemarked = true;
            component.data.event = mockRemarkedEvent;
            
            component.addOrEditRemark();
            tick();

            expect(remarkServiceSpy.getRemarkForEvent).toHaveBeenCalledWith(mockRemarkedEvent._id);
            expect(dialogSpy).toHaveBeenCalledWith(AddRemarkModal, jasmine.objectContaining({
                data: { event: mockRemarkedEvent, remark: mockRemark }
            }));
            expect(dialogRefSpy.close).toHaveBeenCalledWith(true);
        }));
    });
  });

  describe('General functionality', () => {
    beforeEach(async () => {
        await setupTestBed({ event: mockPastEvent }, mockStaffUser);
    });

    it('should format event time correctly', () => {
      const eventWithDuration = { ...mockPastEvent, startTime: new Date('2025-01-01T14:00:00'), duration: 90 };
      const timeString = component.getEventTime(eventWithDuration);
      expect(timeString).toBe('14:00 - 15:30');
    });

    it('should close the dialog when onClose is called', () => {
        component.onClose();
        expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });
});


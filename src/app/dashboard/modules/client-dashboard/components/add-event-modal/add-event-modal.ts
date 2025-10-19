import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, ValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { CommonModule } from '@angular/common';
import { TimeSpinner } from '../../../../../shared/components/time-spinner/time-spinner';
import { MatSelectModule } from '@angular/material/select';
import { BundleService } from '../../../../../services/bundle-service';
import { IBundle, IBundleSubject, IPopulatedUser } from '../../../../../models/interfaces/IBundle.interface';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';
import { combineLatest } from 'rxjs';
import { startWith, filter } from 'rxjs/operators';
import { EventService } from '../../../../../services/event-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { AuthService } from '../../../../../services/auth-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

@Component({
  selector: 'app-add-event-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    TimeSpinner,
    MatSelectModule
  ],
  templateUrl: './add-event-modal.html',
  styleUrls: ['./add-event-modal.scss']
})
export class AddEventModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  public eventService = inject(EventService); 
  private snackBarService = inject(SnackBarService);
  private authService = inject(AuthService);
  public dialogRef = inject(MatDialogRef<AddEventModal>);
  public data: { date: Date, event?: IEvent } = inject(MAT_DIALOG_DATA);

  public eventForm: FormGroup;
  public bundles: IBundle[] = [];
  public subjectsInBundle: IBundleSubject[] = [];
  public remainingMinutes: number | null = null;
  private allEvents: IEvent[] = [];
  public isEditMode = false;
  private currentUser: IUser | null = null;

  constructor() {
    this.isEditMode = !!this.data.event;

    this.eventForm = this.fb.group({
      bundle: ['', Validators.required],
      subject: [{ value: '', disabled: true }, Validators.required],
      startTime: ['09:00', Validators.required],
      duration: [15, [Validators.required, Validators.min(15)]]
    });

    if (this.isEditMode) {
      this.eventForm.get('bundle')?.disable();
      this.eventForm.get('subject')?.disable();
    }
  }

  ngOnInit(): void {
    // Wait for both current user and bundles to load before filtering
    combineLatest([
      this.authService.currentUser$.pipe(filter(user => user !== null)),
      this.bundleService.getBundles()
    ]).subscribe(([user, bundles]) => {
      this.currentUser = user;
      let userBundles = bundles.filter(b => b.isActive && b.status === 'approved');

      if (user.type !== EUserType.Admin) {
        userBundles = userBundles.filter(bundle =>
          bundle.subjects.some(subject => {
            if (!subject.tutor) return false;
            const tutorId = typeof subject.tutor === 'object' ? subject.tutor._id : subject.tutor;
            return tutorId === user._id;
          })
        );
      }
      this.bundles = userBundles;

      if (this.isEditMode && this.data.event) {
        const eventBundle = this.bundles.find(b => b._id === this.data.event!.bundle);
        if (eventBundle) {
            this.eventForm.get('bundle')?.setValue(eventBundle);
            const eventStartTime = new Date(this.data.event!.startTime);
            this.eventForm.get('startTime')?.setValue(`${eventStartTime.getHours().toString().padStart(2, '0')}:${eventStartTime.getMinutes().toString().padStart(2, '0')}`);
            this.eventForm.get('duration')?.setValue(this.data.event!.duration);
            this.eventForm.get('subject')?.setValue(this.data.event!.subject);
        }
      }
    });

    this.eventService.getEvents().subscribe(events => {
      this.allEvents = events;
    });

    // Listen for changes to both bundle and subject to update validation
    const bundleControl = this.eventForm.get('bundle')!;
    const subjectControl = this.eventForm.get('subject')!;

    bundleControl.valueChanges.pipe(startWith(null)).subscribe((bundle: IBundle | null) => {
      let subjects = bundle?.subjects || [];

      // Filter subjects to only show those where current user is the tutor (unless admin)
      if (this.currentUser && this.currentUser.type !== EUserType.Admin && bundle) {
        subjects = subjects.filter(subject => {
          if (!subject.tutor) return false;
          const tutorId = typeof subject.tutor === 'object' ? subject.tutor._id : subject.tutor;
          return tutorId === this.currentUser?._id;
        });
      }

      this.subjectsInBundle = subjects;
      subjectControl.setValue('');
      if (bundle) {
        subjectControl.enable();
      } else {
        subjectControl.disable();
      }
    });

    combineLatest([
      bundleControl.valueChanges.pipe(startWith(bundleControl.value)),
      subjectControl.valueChanges.pipe(startWith(subjectControl.value))
    ]).subscribe(([bundle, subjectName]) => {
      this.updateRemainingMinutes(bundle, subjectName);
    });
  }

  private updateRemainingMinutes(bundle: IBundle, subjectName: string): void {
    const durationControl = this.eventForm.get('duration')!;
    if (!bundle || !subjectName) {
      this.remainingMinutes = null;
      durationControl.setValidators([Validators.required, Validators.min(15)]);
      durationControl.updateValueAndValidity();
      return;
    }

    const subjectDetails = bundle.subjects.find(s => s.subject === subjectName);
    if (!subjectDetails) return;

    let remainingMinutesFromDB = subjectDetails.durationMinutes;

    if (this.isEditMode && this.data.event && this.data.event.subject === subjectName) {
        remainingMinutesFromDB += this.data.event.duration;
    }

    this.remainingMinutes = remainingMinutesFromDB;

    const maxDurationValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
      return control.value > this.remainingMinutes! ? { maxDurationExceeded: true } : null;
    };

    durationControl.setValidators([Validators.required, Validators.min(15), maxDurationValidator]);
    durationControl.updateValueAndValidity();
  }

  getStudentDisplayName(bundle: IBundle): string {
    const student = bundle.student;
    return (typeof student === 'object' && student !== null) ? (student as IPopulatedUser).displayName : '';
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.eventForm.invalid) return;
    
    const { startTime, duration } = this.eventForm.value;
    const [hours, minutes] = startTime.split(':').map(Number);
    const eventStartTime = new Date(this.data.date);
    eventStartTime.setHours(hours, minutes);

    if (this.isEditMode) {
        const eventData = {
            startTime: eventStartTime,
            duration,
        };
        this.eventService.updateEvent(this.data.event!._id, eventData).subscribe({
            next: (updatedEvent) => {
                this.snackBarService.showSuccess('Event updated successfully!');
                this.dialogRef.close(updatedEvent);
            },
            error: (err) => {
                this.snackBarService.showError(err.error?.message || 'Failed to update event.');
            }
        });
    } else {
        const { bundle, subject } = this.eventForm.value;
        const studentId = (bundle.student as IPopulatedUser)._id;
        const eventData = {
          bundleId: bundle._id,
          studentId,
          subject,
          startTime: eventStartTime,
          duration,
        };
    
        this.eventService.createEvent(eventData).subscribe({
          next: (newEvent) => {
            this.snackBarService.showSuccess('Event created successfully!');
            this.dialogRef.close(newEvent);
          },
          error: (err) => {
            this.snackBarService.showError(err.error?.message || 'Failed to create event.');
          }
        });
    }
  }
}
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IBundle, IBundleSubject, IPopulatedUser} from '../../../../../models/interfaces/IBundle.interface';
import { BundleService } from '../../../../../services/bundle-service';
import { NotificationService } from '../../../../../services/notification-service';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

@Component({
  selector: 'app-edit-bundle-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatSlideToggleModule
  ],
  templateUrl: './edit-bundle-modal.html',
  styleUrls: ['./edit-bundle-modal.scss']
})
export class EditBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public dialogRef = inject(MatDialogRef<EditBundleModal>);
  public data: IBundle = inject(MAT_DIALOG_DATA);

  public editForm: FormGroup;
  public isSaving = false;
  
  public filteredTutors$: Observable<IUser[]>[] = [];

  constructor() {
    this.editForm = this.fb.group({
      isActive: [this.data.isActive, Validators.required],
      subjects: this.fb.array([])
    });
  }

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe(() => {
        this.data.subjects.forEach(subject => {
            this.addSubject(subject);
        });
    });
  }

  get subjects(): FormArray {
    return this.editForm.get('subjects') as FormArray;
  }

  private _filterUsers(users: IUser[], value: string | IUser | null): IUser[] {
    let filterValue = '';
    if (typeof value === 'string') {
        filterValue = value.toLowerCase();
    } else if (value) {
        filterValue = value.displayName.toLowerCase();
    }
    
    return users.filter(user => user.displayName.toLowerCase().includes(filterValue));
  }
  
  displayUser(user: IUser): string {
    return user && user.displayName ? user.displayName : '';
  }

  getStudentName(): string {
    return (this.data.student as IPopulatedUser)?.displayName || 'a Student';
  }

  createSubjectGroup(subject?: IBundleSubject): FormGroup {
    const tutorUser = typeof subject?.tutor === 'object' ? subject.tutor : null;
    
    return this.fb.group({
      _id: [subject?._id],
      subject: [subject?.subject || '', Validators.required],
      tutor: [tutorUser?._id || '', Validators.required],
      hours: [subject?.hours || 1, [Validators.required, Validators.min(1)]],
      tutorName: new FormControl(tutorUser || '')
    });
  }

  addSubject(subject?: IBundleSubject): void {
    const subjectGroup = this.createSubjectGroup(subject);
    this.subjects.push(subjectGroup);

    this.filteredTutors$.push(
      combineLatest([
        this.userService.allUsers$,
        subjectGroup.get('tutorName')!.valueChanges.pipe(startWith(subjectGroup.get('tutorName')!.value || ''))
      ]).pipe(
        map(([users, searchValue]) => this._filterUsers(users, searchValue))
      )
    );
  }

  removeSubject(index: number): void {
    this.subjects.removeAt(index);
    this.filteredTutors$.splice(index, 1);
  }

  onTutorSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedTutorId = event.option.value._id;
    this.subjects.at(index).get('tutor')?.setValue(selectedTutorId);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    if (this.editForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;

    const payload = {
        isActive: this.editForm.value.isActive,
        subjects: this.editForm.value.subjects.map((s: IBundleSubject) => ({
            _id: s._id,
            subject: s.subject,
            tutor: s.tutor,
            hours: s.hours
        })),
        status: EBundleStatus.Pending
    };

    this.bundleService.updateBundle(this.data._id, payload).subscribe({
      next: (updatedBundle) => {
        this.notificationService.showSuccess('Bundle updated and set to pending for review.');
        this.dialogRef.close(updatedBundle);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to update bundle.');
      }
    });
  }
}
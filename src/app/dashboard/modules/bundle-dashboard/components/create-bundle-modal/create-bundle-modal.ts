import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { BundleService } from '../../../../../services/bundle-service';
import { NotificationService } from '../../../../../services/notification-service';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { IBundleSubject } from '../../../../../models/interfaces/IBundle.interface';

@Component({
  selector: 'app-create-bundle-modal',
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
    MatAutocompleteModule
  ],
  templateUrl: './create-bundle-modal.html',
  styleUrls: ['./create-bundle-modal.scss']
})
export class CreateBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public dialogRef = inject(MatDialogRef<CreateBundleModal>);

  public createBundleForm: FormGroup;
  public isSaving = false;

  public studentNameCtrl = new FormControl('');
  public filteredStudents$: Observable<IUser[]>;
  public filteredTutors$: Observable<IUser[]>[] = [];

  constructor() {
    this.createBundleForm = this.fb.group({
      student: ['', Validators.required],
      subjects: this.fb.array([])
    });

    this.filteredStudents$ = combineLatest([
      this.userService.allUsers$,
      this.studentNameCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([users, searchValue]) => this._filterUsers(users, searchValue))
    );
  }

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();
    this.addSubject();
  }

  get subjects(): FormArray {
    return this.createBundleForm.get('subjects') as FormArray;
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
  
  onStudentSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedStudentId = event.option.value._id;
    this.createBundleForm.get('student')?.setValue(selectedStudentId);
  }

  createSubjectGroup(): FormGroup {
    return this.fb.group({
      subject: ['', Validators.required],
      tutor: ['', Validators.required],
      hours: [1, [Validators.required, Validators.min(1)]],
      tutorName: new FormControl('') // Control for the tutor autocomplete input
    });
  }

  addSubject(): void {
    const subjectGroup = this.createSubjectGroup();
    this.subjects.push(subjectGroup);

    this.filteredTutors$.push(
        combineLatest([
            this.userService.allUsers$,
            subjectGroup.get('tutorName')!.valueChanges.pipe(startWith(''))
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

  onCreate(): void {
    if (this.createBundleForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;
    
    // We only need student, subjects, and hours for the API call
    const payload = {
        student: this.createBundleForm.value.student,
        subjects: this.createBundleForm.value.subjects.map((s: IBundleSubject) => ({
            subject: s.subject,
            tutor: s.tutor,
            hours: s.hours
        }))
    };

    this.bundleService.createBundle(payload.student, payload.subjects).subscribe({
      next: (newBundle) => {
        this.notificationService.showSuccess('Bundle created successfully!');
        this.dialogRef.close(newBundle);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to create bundle.');
      }
    });
  }
}
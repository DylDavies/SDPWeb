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
import { MatSelectModule } from '@angular/material/select';
import { BundleService } from '../../../../../services/bundle-service';
import { NotificationService } from '../../../../../services/notification-service';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Observable, combineLatest } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

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
    MatAutocompleteModule,
    MatSelectModule
  ],
  templateUrl: './create-bundle-modal.html',
  styleUrls: ['./create-bundle-modal.scss']
})
export class CreateBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  private proficiencyService = inject(ProficiencyService);
  public dialogRef = inject(MatDialogRef<CreateBundleModal>);

  public createBundleForm: FormGroup;
  public isSaving = false;

  public studentNameCtrl = new FormControl('', [Validators.required]);
  public filteredStudents$: Observable<IUser[]>;
  public filteredTutors$: Observable<IUser[]>[] = [];
  public proficiencies$: Observable<IProficiency[]>;
  public filteredProficiencies$: Observable<IProficiency[]>[] = [];
  public filteredSubjects$: Observable<ISubject[]>[] = [];
  public grades$: Observable<string[]>[] = [];

  constructor() {
    this.createBundleForm = this.fb.group({
      student: ['', Validators.required],
      subjects: this.fb.array([])
    });

    this.filteredStudents$ = combineLatest([
      this.userService.allUsers$,
      this.studentNameCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([users, searchValue]) => {
        const clients = users.filter(user => user.type === EUserType.Client);
        return this._filterUsers(clients, searchValue);
      })
    );
    this.proficiencies$ = this.proficiencyService.allProficiencies$;
  }

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();
    this.proficiencyService.fetchAllProficiencies().subscribe();
    this.addSubject();
  }

  get subjects(): FormArray {
    return this.createBundleForm.get('subjects') as FormArray;
  }
  
  getFormControl(index: number, controlName: string): FormControl {
    return (this.subjects.at(index) as FormGroup).get(controlName) as FormControl;
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
  
  private _filterProficiencies(profs: IProficiency[], value: string | IProficiency | null): IProficiency[] {
    let filterValue = '';
    if(typeof value === 'string') {
        filterValue = value.toLowerCase();
    } else if (value) {
        filterValue = value.name.toLowerCase();
    }
    
    return profs.filter(prof => prof.name.toLowerCase().includes(filterValue));
  }
  
  private _filterSubjects(subjects: ISubject[], value: string | ISubject | null): ISubject[] {
      let filterValue = '';
      if(typeof value === 'string') {
          filterValue = value.toLowerCase();
      } else if (value) {
          filterValue = value.name.toLowerCase();
      }
      
      return subjects.filter(subject => subject.name.toLowerCase().includes(filterValue));
  }

  displayUser(user: IUser): string {
    return user && user.displayName ? user.displayName : '';
  }
  
  displayProf(prof: IProficiency): string {
      return prof && prof.name ? prof.name : '';
  }
  
  displaySubject(subject: ISubject): string {
        return subject && subject.name ? subject.name : '';
  }

  onStudentSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedStudentId = event.option.value._id;
    this.createBundleForm.get('student')?.setValue(selectedStudentId);
  }

  createSubjectGroup(): FormGroup {
    return this.fb.group({
      proficiency: ['', Validators.required],
      grade: [{value: '', disabled: true}, Validators.required],
      tutor: ['', Validators.required],
      hours: [1, [Validators.required, Validators.min(1)]],
      tutorName: new FormControl('', [Validators.required]),
      proficiencyName: new FormControl('', [Validators.required]),
      subjectName: new FormControl({value: '', disabled: true}, [Validators.required])
    });
  }

  addSubject(): void {
    const subjectGroup = this.createSubjectGroup();
    this.subjects.push(subjectGroup);

    const index = this.subjects.length - 1;

    this.filteredProficiencies$[index] = combineLatest([
        this.proficiencies$,
        subjectGroup.get('proficiencyName')!.valueChanges.pipe(startWith(''))
    ]).pipe(
        map(([profs, searchValue]) => this._filterProficiencies(profs, searchValue))
    );

    this.filteredSubjects$[index] = combineLatest([
        subjectGroup.get('proficiency')!.valueChanges.pipe(
            startWith(subjectGroup.get('proficiency')!.value),
            map(prof => prof ? Object.values(prof.subjects) as ISubject[] : [])
        ),
        subjectGroup.get('subjectName')!.valueChanges.pipe(startWith(''))
    ]).pipe(
        map(([subjects, searchValue]) => this._filterSubjects(subjects, searchValue))
    );

    this.grades$[index] = subjectGroup.get('subjectName')!.valueChanges.pipe(
        startWith(subjectGroup.get('subjectName')!.value),
        map(subject => subject ? subject.grades : [])
    );

    this.filteredTutors$[index] = combineLatest([
        this.userService.allUsers$,
        subjectGroup.get('tutorName')!.valueChanges.pipe(startWith(''))
    ]).pipe(
        map(([users, searchValue]) => {
            const tutors = users.filter(user => user.type === EUserType.Staff || user.type === EUserType.Admin);
            return this._filterUsers(tutors, searchValue);
        })
    );

    const proficiencyCtrl = subjectGroup.get('proficiency')!;
    const proficiencyNameCtrl = subjectGroup.get('proficiencyName')!;
    const subjectNameCtrl = subjectGroup.get('subjectName')!;
    const gradeCtrl = subjectGroup.get('grade')!;

    // When the user clears the input field, reset the backing form control.
    proficiencyNameCtrl.valueChanges.subscribe(value => {
        // This checks if the user has cleared the input. 
        // An object value means an item was selected from the autocomplete.
        if (typeof value === 'string' && value.trim() === '') {
            proficiencyCtrl.setValue(null);
        }
    });

    // When the proficiency object changes (is set or cleared), update dependent fields.
    proficiencyCtrl.valueChanges.subscribe(prof => {
        subjectNameCtrl.reset({ value: '', disabled: true });
        gradeCtrl.reset({ value: '', disabled: true });

        if (prof) { // If a proficiency object exists
            subjectNameCtrl.enable();
        }
    });

    // When the subject object changes, update the grade field.
    subjectNameCtrl.valueChanges.subscribe(subject => {
        gradeCtrl.reset({ value: '', disabled: true });
        
        if (subject) { // If a subject object exists
            gradeCtrl.enable();
        }
    });
  }

  removeSubject(index: number): void {
    this.subjects.removeAt(index);
    this.filteredTutors$.splice(index, 1);
    this.filteredProficiencies$.splice(index, 1);
    this.filteredSubjects$.splice(index, 1);
    this.grades$.splice(index, 1);
  }

  onTutorSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedTutorId = event.option.value._id;
    this.subjects.at(index).get('tutor')?.setValue(selectedTutorId);
  }
  
  onProficiencySelected(event: MatAutocompleteSelectedEvent, index: number): void {
      const selectedProf = event.option.value;
      this.subjects.at(index).get('proficiency')?.setValue(selectedProf);
  }
  
  onSubjectSelected(event: MatAutocompleteSelectedEvent, index: number): void {
      const selectedSubject = event.option.value;
      this.subjects.at(index).get('subjectName')?.setValue(selectedSubject);
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.createBundleForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;
    
    const payload = {
        student: this.createBundleForm.value.student,
        subjects: this.createBundleForm.value.subjects.map((s: { subjectName: ISubject, grade: string, tutor: string, hours: number }) => ({
            subject: s.subjectName.name,
            grade: s.grade,
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

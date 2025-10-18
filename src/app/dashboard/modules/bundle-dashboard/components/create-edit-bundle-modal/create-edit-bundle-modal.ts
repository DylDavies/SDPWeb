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
import { MatSelectModule } from '@angular/material/select';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, filter, first } from 'rxjs/operators';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';
import { IBundle, IBundleSubject, IPopulatedUser, IAddress } from '../../../../../models/interfaces/IBundle.interface';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { TimeSpinner } from '../../../../../shared/components/time-spinner/time-spinner';
import { AddressAutocompleteComponent } from '../../../../../shared/components/address-autocomplete/address-autocomplete';

@Component({
  selector: 'app-create-edit-bundle-modal', // Updated selector
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule,
    MatInputModule, MatButtonModule, MatIconModule, MatDividerModule,
    MatProgressSpinnerModule, MatAutocompleteModule, MatSelectModule, TimeSpinner,
    AddressAutocompleteComponent
  ],
  templateUrl: './create-edit-bundle-modal.html', // Updated template URL
  styleUrls: ['./create-edit-bundle-modal.scss'] // Updated style URL
})
export class CreateEditBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private snackbarService = inject(SnackBarService);
  private userService = inject(UserService);
  private proficiencyService = inject(ProficiencyService);
  public dialogRef = inject(MatDialogRef<CreateEditBundleModal>);
  public data: { bundle?: IBundle } = inject(MAT_DIALOG_DATA);

  public bundleForm: FormGroup;
  public isSaving = false;
  public isEditMode = false;
  public validationError: string | null = null;

  public studentNameCtrl = new FormControl({ value: '', disabled: false }, [Validators.required]);
  public managerNameCtrl = new FormControl('');
  public stakeholderNameCtrl = new FormControl('');
  public filteredStudents$: Observable<IUser[]>;
  public filteredManagers$: Observable<IUser[]>;
  public filteredStakeholders$: Observable<IUser[]>;
  public filteredTutors$: Observable<IUser[]>[] = [];
  public proficiencies$: Observable<IProficiency[]>;
  public filteredProficiencies$: Observable<IProficiency[]>[] = [];
  public filteredSubjects$: Observable<ISubject[]>[] = [];
  public grades$: BehaviorSubject<string[]>[] = [];
  public selectedStakeholders: IPopulatedUser[] = [];

  constructor() {
    this.isEditMode = !!this.data?.bundle;

    this.bundleForm = this.fb.group({
      student: ['', Validators.required],
      lessonLocation: [''],
      manager: [''],
      stakeholders: [[]],
      subjects: this.fb.array([])
    });

    if (this.isEditMode) {
      this.studentNameCtrl.disable();
    }

    this.filteredStudents$ = combineLatest([
      this.userService.allUsers$,
      this.studentNameCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([users, searchValue]) => {
        const clients = users.filter(user => user.type === EUserType.Client);
        return this._filterUsers(clients, searchValue);
      })
    );

    this.filteredManagers$ = combineLatest([
      this.userService.allUsers$,
      this.managerNameCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([users, searchValue]) => {
        const staff = users.filter(user => user.type === EUserType.Staff || user.type === EUserType.Admin);
        return this._filterUsers(staff, searchValue);
      })
    );

    this.filteredStakeholders$ = combineLatest([
      this.userService.allUsers$,
      this.stakeholderNameCtrl.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([users, searchValue]) => {
        const allUsers = users.filter(user =>
          !this.selectedStakeholders.find(s => s._id === user._id)
        );
        return this._filterUsers(allUsers, searchValue);
      })
    );

    this.proficiencies$ = this.proficiencyService.allProficiencies$;
  }

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();

    // Run validation whenever subjects change
    this.subjects.valueChanges.subscribe(() => {
      this.validationError = this.validateNoDuplicateTutorSubjects();
    });

    this.proficiencyService.fetchAllProficiencies().subscribe(() => {
        if (this.isEditMode && this.data.bundle) {
            this.bundleForm.get('student')?.setValue((this.data.bundle.student as IPopulatedUser)._id);
            this.studentNameCtrl.setValue((this.data.bundle.student as IPopulatedUser).displayName);

            // Set lesson location
            if (this.data.bundle.lessonLocation) {
              this.bundleForm.get('lessonLocation')?.setValue(this.data.bundle.lessonLocation);
            }

            // Set manager
            if (this.data.bundle.manager) {
              const manager = this.data.bundle.manager as IPopulatedUser;
              this.bundleForm.get('manager')?.setValue(manager._id);
              this.managerNameCtrl.setValue(manager.displayName);
            }

            // Set stakeholders
            if (this.data.bundle.stakeholders && Array.isArray(this.data.bundle.stakeholders) && this.data.bundle.stakeholders.length > 0) {
              this.selectedStakeholders = (this.data.bundle.stakeholders as IPopulatedUser[]);
              this.bundleForm.get('stakeholders')?.setValue(this.selectedStakeholders.map(s => s._id));
            }

            this.data.bundle.subjects.forEach(subject => this.addSubject(subject));
        } else {
            this.addSubject();
        }
    });
  }

  get subjects(): FormArray {
    return this.bundleForm.get('subjects') as FormArray;
  }
  
  getFormControl(index: number, controlName: string): FormControl {
    return (this.subjects.at(index) as FormGroup).get(controlName) as FormControl;
  }

  private _filterUsers(users: IUser[], value: string | IUser | IPopulatedUser | null): IUser[] {
    let filterValue = '';
    if (typeof value === 'string') {
        filterValue = value.toLowerCase();
    } else if (value && value.displayName) {
        filterValue = value.displayName.toLowerCase();
    }

    return users.filter(user => user.displayName && user.displayName.toLowerCase().includes(filterValue));
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

  displayUser(user: IUser | IPopulatedUser | null): string {
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
    this.bundleForm.get('student')?.setValue(selectedStudentId);
  }

  onManagerSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedManagerId = event.option.value._id;
    this.bundleForm.get('manager')?.setValue(selectedManagerId);
  }

  onStakeholderSelected(event: MatAutocompleteSelectedEvent): void {
    const selectedStakeholder: IPopulatedUser = event.option.value;
    this.selectedStakeholders.push(selectedStakeholder);
    this.bundleForm.get('stakeholders')?.setValue(this.selectedStakeholders.map(s => s._id));
    this.stakeholderNameCtrl.setValue('');
  }

  removeStakeholder(stakeholder: IPopulatedUser): void {
    this.selectedStakeholders = this.selectedStakeholders.filter(s => s._id !== stakeholder._id);
    this.bundleForm.get('stakeholders')?.setValue(this.selectedStakeholders.map(s => s._id));
  }

  onAddressSelected(address: IAddress | undefined): void {
    this.bundleForm.get('lessonLocation')?.setValue(address);
  }

  createSubjectGroup(): FormGroup {
    return this.fb.group({
      _id: [null],
      proficiency: ['', Validators.required],
      grade: [{value: '', disabled: true}, Validators.required],
      tutor: ['', Validators.required],
      duration: [60, [Validators.required, Validators.min(15)]],
      tutorName: new FormControl('', [Validators.required]),
      proficiencyName: new FormControl('', [Validators.required]),
      subjectName: new FormControl({value: '', disabled: true}, [Validators.required])
    });
  }

  addSubject(bundleSubject?: IBundleSubject): void {
    const subjectGroup = this.createSubjectGroup();
    this.subjects.push(subjectGroup);

    const index = this.subjects.length - 1;

    this.grades$[index] = new BehaviorSubject<string[]>([]);

    this.filteredProficiencies$[index] = combineLatest([
      this.proficiencies$,
      subjectGroup.get('proficiencyName')!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([profs, searchValue]) => this._filterProficiencies(profs, searchValue || ''))
    );

    this.filteredSubjects$[index] = combineLatest([
      subjectGroup.get('proficiency')!.valueChanges.pipe(
        startWith(subjectGroup.get('proficiency')!.value),
        map(prof => (prof && prof.subjects) ? Object.values(prof.subjects) as ISubject[] : [])
      ),
      subjectGroup.get('subjectName')!.valueChanges.pipe(startWith(''))
    ]).pipe(
      map(([subjects, searchValue]) => this._filterSubjects(subjects, searchValue || ''))
    );

    this.filteredTutors$[index] = combineLatest([
      this.userService.allUsers$.pipe(
        map(users => users.filter(user => user.type === EUserType.Staff || user.type === EUserType.Admin))
      ),
      subjectGroup.get('tutorName')!.valueChanges.pipe(startWith(subjectGroup.get('tutorName')!.value || ''))
    ]).pipe(
      map(([users, searchValue]) => this._filterUsers(users, searchValue))
    );

    const proficiencyCtrl = subjectGroup.get('proficiency')!;
    const proficiencyNameCtrl = subjectGroup.get('proficiencyName')!;
    const subjectNameCtrl = subjectGroup.get('subjectName')!;
    const gradeCtrl = subjectGroup.get('grade')!;

    proficiencyNameCtrl.valueChanges.subscribe(value => {
        if (typeof value === 'string' && value.trim() === '') {
            proficiencyCtrl.setValue(null);
        }
    });

    proficiencyCtrl.valueChanges.subscribe(prof => {
        subjectNameCtrl.reset({ value: '', disabled: true });
        gradeCtrl.reset({ value: '', disabled: true });

        if (prof) {
            subjectNameCtrl.enable();
        }
    });

    subjectNameCtrl.valueChanges.subscribe(subject => {
        gradeCtrl.reset({ value: '', disabled: true });
        
        if (subject && typeof subject !== 'string') {
            this.grades$[index].next(subject.grades || []);
            gradeCtrl.enable();
        } else {
            this.grades$[index].next([]);
        }
    });

    if (bundleSubject) {
      const tutorUser = typeof bundleSubject?.tutor === 'object' ? bundleSubject.tutor : null;
      subjectGroup.patchValue({
          _id: bundleSubject._id,
          tutor: tutorUser?._id || '',
          duration: bundleSubject.durationMinutes || 60,
          tutorName: tutorUser || '',
      }, { emitEvent: false });

      this.proficiencies$.pipe(
        filter(profs => profs.length > 0),
        first()
      ).subscribe(allProficiencies => {
        let matchingProf: IProficiency | undefined;
        let matchingSubject: ISubject | undefined;

        for (const prof of allProficiencies) {
          const subjectKey = Object.keys(prof.subjects).find(key => prof.subjects[key].name === bundleSubject.subject);
          if (subjectKey) {
            matchingProf = prof;
            matchingSubject = prof.subjects[subjectKey];
            break;
          }
        }

        if (matchingProf && matchingSubject) {
          this.grades$[index].next(matchingSubject.grades);
          
          proficiencyCtrl.setValue(matchingProf, { emitEvent: false });
          proficiencyNameCtrl.setValue(matchingProf, { emitEvent: false });

          subjectNameCtrl.enable({ emitEvent: false });
          subjectNameCtrl.setValue(matchingSubject, { emitEvent: false });

          gradeCtrl.enable({ emitEvent: false });
          gradeCtrl.setValue(bundleSubject.grade);
        }
      });
    }
  }

  removeSubject(index: number): void {
    this.subjects.removeAt(index);
    this.filteredTutors$.splice(index, 1);
    this.filteredProficiencies$.splice(index, 1);
    this.filteredSubjects$.splice(index, 1);
    this.grades$.splice(index, 1);
    // Re-run validation after removing a subject
    this.validationError = this.validateNoDuplicateTutorSubjects();
  }

  onTutorSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedTutorId = event.option.value._id;
    this.subjects.at(index).get('tutor')?.setValue(selectedTutorId);
    // Run validation immediately after tutor selection
    this.validationError = this.validateNoDuplicateTutorSubjects();
  }

  onProficiencySelected(event: MatAutocompleteSelectedEvent, index: number): void {
      const selectedProf = event.option.value;
      this.subjects.at(index).get('proficiency')?.setValue(selectedProf);
  }

  onSubjectSelected(event: MatAutocompleteSelectedEvent, index: number): void {
      const selectedSubject = event.option.value;
      this.subjects.at(index).get('subjectName')?.setValue(selectedSubject);
      // Run validation immediately after subject selection
      this.validationError = this.validateNoDuplicateTutorSubjects();
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private validateNoDuplicateTutorSubjects(): string | null {
    const subjects = this.bundleForm.value.subjects;
    const tutorSubjectMap = new Map<string, string>();

    for (let i = 0; i < subjects.length; i++) {
      const subject = subjects[i];
      if (!subject.tutor || !subject.subjectName?.name) {
        continue;
      }

      const key = `${subject.tutor}-${subject.subjectName.name}`;

      if (tutorSubjectMap.has(key)) {
        // Find tutor name for better error message
        const tutorControl = this.getFormControl(i, 'tutorName');
        const tutorName = tutorControl.value?.displayName || 'this tutor';
        return `Duplicate tutor-subject combination: ${tutorName} is already assigned to ${subject.subjectName.name}. Each tutor can only be assigned to a subject once per bundle.`;
      }

      tutorSubjectMap.set(key, subject.subjectName.name);
    }

    return null;
  }

  onSave(): void {
    if (this.bundleForm.invalid || this.isSaving || this.validationError) {
      return;
    }

    this.isSaving = true;

    const subjectsPayload = this.bundleForm.value.subjects.map((s: { _id: string | null, subjectName: ISubject, grade: string, tutor: string, duration: number }) => {
        const payload: Partial<IBundleSubject> & { subject: string; grade: string; tutor: string; durationMinutes: number } = {
            subject: s.subjectName.name,
            grade: s.grade,
            tutor: s.tutor,
            durationMinutes: s.duration
        };
        // Only include _id if it exists and is not empty (for edit mode)
        if (s._id && s._id !== '') {
            payload._id = s._id;
        }
        return payload;
    });

    if (this.isEditMode) {
      const payload: Partial<IBundle> = {
        subjects: subjectsPayload as IBundleSubject[],
        status: EBundleStatus.Pending,
        lessonLocation: this.bundleForm.value.lessonLocation || undefined,
        manager: this.bundleForm.value.manager as string | undefined,
        stakeholders: this.bundleForm.value.stakeholders || []
      };
      this.bundleService.updateBundle(this.data.bundle!._id, payload).subscribe({
        next: (updatedBundle) => {
          this.snackbarService.showSuccess('Bundle updated and set to pending for review.');
          this.dialogRef.close(updatedBundle);
        },
        error: (err) => {
          this.isSaving = false;
          this.snackbarService.showError(err.error?.message || 'Failed to update bundle.');
        }
      });
    } else {
      this.bundleService.createBundle(
        this.bundleForm.value.student,
        subjectsPayload,
        this.bundleForm.value.lessonLocation || undefined,
        this.bundleForm.value.manager || undefined,
        this.bundleForm.value.stakeholders || []
      ).subscribe({
        next: (newBundle) => {
          this.snackbarService.showSuccess('Bundle created successfully!');
          this.dialogRef.close(newBundle);
        },
        error: (err) => {
          this.isSaving = false;
          this.snackbarService.showError(err.error?.message || 'Failed to create bundle.');
        }
      });
    }
  }
}
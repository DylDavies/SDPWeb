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
import { MatSelectModule } from '@angular/material/select';
import { IBundle, IBundleSubject, IPopulatedUser} from '../../../../../models/interfaces/IBundle.interface';
import { BundleService } from '../../../../../services/bundle-service';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { EBundleStatus } from '../../../../../models/enums/bundle-status.enum';
import { UserService } from '../../../../../services/user-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map, startWith, filter, first } from 'rxjs/operators';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { EUserType } from '../../../../../models/enums/user-type.enum';

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
    MatSlideToggleModule,
    MatSelectModule
  ],
  templateUrl: './edit-bundle-modal.html',
  styleUrls: ['./edit-bundle-modal.scss']
})
export class EditBundleModal implements OnInit {
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private snackbarService = inject(SnackBarService);
  private userService = inject(UserService);
  private proficiencyService = inject(ProficiencyService);
  public dialogRef = inject(MatDialogRef<EditBundleModal>);
  public data: IBundle = inject(MAT_DIALOG_DATA);

  public editForm: FormGroup;
  public isSaving = false;
  
  public filteredTutors$: Observable<IUser[]>[] = [];
  public proficiencies$: Observable<IProficiency[]>;
  public filteredProficiencies$: Observable<IProficiency[]>[] = [];
  public filteredSubjects$: Observable<ISubject[]>[] = [];
  public grades$: BehaviorSubject<string[]>[] = [];

  constructor() {
    this.editForm = this.fb.group({
      subjects: this.fb.array([])
    });
    this.proficiencies$ = this.proficiencyService.allProficiencies$;
  }

  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();
    this.proficiencyService.fetchAllProficiencies().subscribe(() => {
        this.data.subjects.forEach(subject => {
            this.addSubject(subject);
        });
    });
  }

  get subjects(): FormArray {
    return this.editForm.get('subjects') as FormArray;
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

  getStudentName(): string {
    return (this.data.student as IPopulatedUser)?.displayName || 'a Student';
  }

  createSubjectGroup(): FormGroup {
    return this.fb.group({
      _id: [null],
      proficiency: ['', Validators.required],
      grade: [{value: '', disabled: true}, Validators.required],
      tutor: ['', Validators.required],
      hours: [1, [Validators.required, Validators.min(1)]],
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
        map(prof => prof ? Object.values(prof.subjects) as ISubject[] : [])
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
          hours: bundleSubject.hours || 1,
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

  onSave(): void {
    if (this.editForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;

    const payload = {
        subjects: this.editForm.value.subjects.map((s: { _id: string, subjectName: ISubject, grade: string, tutor: string, hours: number }) => ({
            _id: s._id,
            subject: s.subjectName.name,
            grade: s.grade,
            tutor: s.tutor,
            hours: s.hours
        })),
        status: EBundleStatus.Pending
    };

    this.bundleService.updateBundle(this.data._id, payload).subscribe({
      next: (updatedBundle) => {
        this.snackbarService.showSuccess('Bundle updated and set to pending for review.');
        this.dialogRef.close(updatedBundle);
      },
      error: (err) => {
        this.isSaving = false;
        this.snackbarService.showError(err.error?.message || 'Failed to update bundle.');
      }
    });
  }
}

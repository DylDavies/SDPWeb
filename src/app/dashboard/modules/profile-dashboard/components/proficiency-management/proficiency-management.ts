import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { Observable, forkJoin } from 'rxjs';
import { map, startWith, filter, switchMap } from 'rxjs/operators';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { IGrade } from '../../../../../models/interfaces/IGrade.interface';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { AuthService } from '../../../../../services/auth-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { BackendSubject } from '../../../../../models/interfaces/IBackendSubject.interface';
import { UserService } from '../../../../../services/user-service';
import { NotificationService } from '../../../../../services/notification-service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { IBackendProficiency } from '../../../../../models/interfaces/IBackendProficiency.interface';

@Component({
  selector: 'app-proficiency-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTabsModule,
    MatChipsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatOptionModule,
    MatButtonModule,
    MatListModule,
    MatIconModule,
    MatDialogModule,
  ],
  templateUrl: './proficiency-management.html',
  styleUrls: ['./proficiency-management.scss'],
})
export class ProficiencyManagement implements OnInit {
  @ViewChild('subjectInput') subjectInput!: ElementRef<HTMLInputElement>;
  public dialogRef = inject(MatDialogRef<ProficiencyManagement>);
  public authService = inject(AuthService);
  public user: IUser | null = null;

  private profService = inject(ProficiencyService);
  private userService = inject(UserService);
  private notificationService = inject(NotificationService);
  private dialog = inject(MatDialog);

  proficiencies: IProficiency[] = [];
  selectedSyllabus: string | null = null;
  availableSubjects: string[] = [];
  selectedSubjects: string[] = [];
  userProficiencies: IProficiency[] = [];
  selectedUserSyllabus: string | null = null;
  selectedUserSyllabusSubjects: ISubject[] = [];
  
  syllabusSelections: Record<string, Record<string, string[]>> = {};

  selectedGrades: string[] = [];
  selectedSubject: string | null = null;
  public availableGrades: IGrade[] = [];
  subjectCtrl = new FormControl('');
  filteredSubjects!: Observable<string[]>;

  ngOnInit(): void {
    this.authService.currentUser$.subscribe({
      next: (user) => {
        this.user = user;
        this.userProficiencies = user?.proficiencies || [];
        if (this.userProficiencies?.length > 0) {
          this.onUserSyllabusSelect(this.userProficiencies[0].name);
        }
      },
    });

    this.profService.fetchAllProficiencies().subscribe({
      next: (data) => {
        this.proficiencies = data;
        this.availableSubjects = Array.from(
          new Set(
            this.proficiencies.flatMap((prof) =>
              Object.values(prof.subjects).map((s: ISubject) => s.name)
            )
          )
        );
        if (this.proficiencies.length > 0) {
          this.onSyllabusSelect(this.proficiencies[0].name);
        }
      },
      error: (err) => console.error('Error fetching proficiencies:', err),
    });

    this.filteredSubjects = this.subjectCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.availableSubjects.filter(
      (s) => !this.selectedSubjects.includes(s) && s.toLowerCase().includes(filterValue)
    );
  }

  onSyllabusSelect(name: string) {
    this.selectedSyllabus = name;
    if (!this.syllabusSelections[name]) {
      this.syllabusSelections[name] = {};
    }
    this.selectedSubjects = Object.keys(this.syllabusSelections[name]);
    this.selectedSubject = null;
    this.selectedGrades = [];
    this.clearInput(false);
  }

  onUserSyllabusSelect(name: string): void {
    const prof = this.userProficiencies?.find((p) => p.name === name);
    if (prof) {
      this.selectedUserSyllabus = name;
      if (typeof prof.subjects === 'object' && !Array.isArray(prof.subjects)) {
        this.selectedUserSyllabusSubjects = Object.values(prof.subjects);
      } else {
        this.selectedUserSyllabusSubjects = [];
      }
    }
  }

  onAutocompleteSelected(event: MatAutocompleteSelectedEvent) {
    const subjectName = event.option.value;
    this.addSubjectToSelection(subjectName);
    this.selectSubjectForEditing(subjectName);
    this.clearInput(true);
  }
  
  onChipClick(subjectName: string) {
    this.selectSubjectForEditing(subjectName);
  }

  private addSubjectToSelection(subjectName: string): void {
    if (!this.selectedSyllabus) return;
    if (!this.syllabusSelections[this.selectedSyllabus][subjectName]) {
      this.syllabusSelections[this.selectedSyllabus][subjectName] = [];
    }
    this.selectedSubjects = Object.keys(this.syllabusSelections[this.selectedSyllabus]);
  }
  
  private selectSubjectForEditing(subjectName: string) {
    this.selectedSubject = subjectName;
    this.updateAvailableGrades(subjectName);
    this.selectedGrades = this.selectedSyllabus ? this.syllabusSelections[this.selectedSyllabus]?.[subjectName] || [] : [];
  }

  private updateAvailableGrades(subjectName: string): void {
    this.availableGrades = [];
    if (!this.selectedSyllabus) return;
    
    const syllabus = this.proficiencies.find(p => p.name === this.selectedSyllabus);
    if (!syllabus) return;

    const subjectObject = Object.values(syllabus.subjects).find((s: ISubject) => s.name === subjectName) as BackendSubject | undefined;
    if (!subjectObject) return;

    const gradesData = subjectObject.grade;
    if (!gradesData) return;

    if (Array.isArray(gradesData)) {
      this.availableGrades = gradesData.map(gradeName => ({ name: gradeName }));
    } else if (typeof gradesData === 'string') {
      this.availableGrades = [{ name: gradesData }];
    }
  }

  addSubjectWithGrades() {
    if (!this.selectedSyllabus || !this.selectedSubject) return;
    this.syllabusSelections[this.selectedSyllabus][this.selectedSubject] = [...this.selectedGrades];
    this.selectedSubject = null;
    this.selectedGrades = [];
  }

  getGradeNames(subject: ISubject): string {
    const grades = (subject as BackendSubject).grade;

    if (Array.isArray(grades)) {
      return grades.join(', ');
    }
    return grades || '';
  }

  private clearInput(refocus = false) {
    this.subjectCtrl.setValue('');
    if (this.subjectInput) {
      this.subjectInput.nativeElement.value = '';
      if (refocus) setTimeout(() => this.subjectInput.nativeElement.focus(), 0);
    }
  }

  removeSubject(subject: string) {
    if (!this.selectedSyllabus) return;
    delete this.syllabusSelections[this.selectedSyllabus][subject];
    this.selectedSubjects = Object.keys(this.syllabusSelections[this.selectedSyllabus]);
    if (this.selectedSubject === subject) {
      this.selectedSubject = null;
      this.selectedGrades = [];
    }
  }

  confirmSave(): void {
    if (!this.user) return;
  
    const proficienciesToSave: IBackendProficiency[] = Object.keys(this.syllabusSelections).map(syllabusName => {
      const subjectSelections = this.syllabusSelections[syllabusName];
      const subjectsAsObject: Record<string, BackendSubject> = {};
  
      Object.keys(subjectSelections).forEach(subjectName => {
        const subjectKey = subjectName.toLowerCase().replace(/\s+/g, '_');
        subjectsAsObject[subjectKey] = {
          name: subjectName,
          grade: subjectSelections[subjectName],
          grades: subjectSelections[subjectName].map(g => ({ name: g }))
        };
      });
  
      return {
        name: syllabusName,
        subjects: subjectsAsObject,
      };
    });
  
    if (proficienciesToSave.length === 0) {
      this.notificationService.showInfo("No changes to save.");
      return;
    }
  
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Confirm Changes',
        message: 'Are you sure you want to save these proficiency changes?',
        confirmText: 'Save'
      }
    });
  
    dialogRef.afterClosed().pipe(
      filter((result): result is boolean => result === true),
      switchMap(() => {
        const userId = this.user!._id;
        const updateObservables = proficienciesToSave.map(prof => 
          this.userService.updateUserProficiency(userId, prof)
        );
        return forkJoin(updateObservables);
      })
    ).subscribe({
      next: (updatedUsers: IUser[]) => {
        const finalUpdatedUser = updatedUsers[updatedUsers.length - 1];
        this.authService.updateCurrentUserState(finalUpdatedUser);
        this.notificationService.showSuccess('Proficiencies updated successfully!');
        this.dialogRef.close(true);
      },
      error: (err) => {
        console.error('Failed to update proficiencies', err);
        this.notificationService.showError('An error occurred while saving.');
      }
    });
  }
}
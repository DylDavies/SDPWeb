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
import { Observable } from 'rxjs';
import { map, startWith, filter, switchMap } from 'rxjs/operators';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { ProficiencyService } from '../../../../../services/proficiency-service';
import { AuthService } from '../../../../../services/auth-service';
import { IUser } from '../../../../../models/interfaces/IUser.interface';
import { BackendSubject } from '../../../../../models/interfaces/IBackendSubject.interface';
import { UserService } from '../../../../../services/user-service';
import { NotificationService } from '../../../../../services/notification-service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { IBackendProficiency } from '../../../../../models/interfaces/IBackendProficiency.interface';
import * as _ from 'lodash'; 
import { lastValueFrom } from 'rxjs';

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
  private initialSyllabusSelections: Record<string, Record<string, string[]>> = {};

  selectedGrades: string[] = [];
  selectedSubject: string | null = null;
  public availableGrades: string[] = [];
  subjectCtrl = new FormControl('');
  filteredSubjects!: Observable<string[]>;

  public selectedTabIndex = 0;

  ngOnInit(): void {
    this.authService.currentUser$.pipe(
      filter((user): user is IUser => !!user),
      switchMap(user => {
        this.user = user;
        if (user.proficiencies) {
          this.userProficiencies = user.proficiencies;
          this.prepopulateSyllabusSelections();
        }
        return this.profService.fetchAllProficiencies();
      })
    ).subscribe({
      next: (allProficiencies) => {
        this.proficiencies = allProficiencies;
        if (this.proficiencies.length > 0) {
          const initialSyllabus = this.selectedSyllabus || this.proficiencies[0].name;
          this.onSyllabusSelect(initialSyllabus);
        }
        if (this.userProficiencies.length > 0) {
          this.onUserSyllabusSelect(this.userProficiencies[0].name);
        }
      },
      error: (err) => console.error('Error initializing proficiency data:', err),
    });

    this.filteredSubjects = this.subjectCtrl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filter(value || ''))
    );
  }

  private prepopulateSyllabusSelections(): void {
    this.syllabusSelections = {};
    this.userProficiencies.forEach(prof => {
        this.syllabusSelections[prof.name] = {};
        if (prof.subjects) {
            Object.values(prof.subjects).forEach(subject => {
                this.syllabusSelections[prof.name][subject.name] = [...subject.grades];
            });
        }
    });
    this.initialSyllabusSelections = _.cloneDeep(this.syllabusSelections);
  }

  isSaveDisabled(): boolean {
    return _.isEqual(this.syllabusSelections, this.initialSyllabusSelections);
  }

  private _filter(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.availableSubjects.filter(
      (s) => !this.selectedSubjects.includes(s) && s.toLowerCase().includes(filterValue)
    );
  }

  onSyllabusSelect(name: string) {
    this.selectedSyllabus = name;
    
    const syllabus = this.proficiencies.find(p => p.name === name);
    this.availableSubjects = syllabus ? Object.values(syllabus.subjects).map((s: ISubject) => s.name) : [];
    
    if (!this.syllabusSelections[name]) {
      this.syllabusSelections[name] = {};
    }
    
    this.selectedSubjects = Object.keys(this.syllabusSelections[name]);
    this.selectedSubject = null;
    this.selectedGrades = [];
    this.clearInput(false);
    
    this.subjectCtrl.setValue('');
  }

  onUserSyllabusSelect(name: string): void {
    const prof = this.userProficiencies?.find((p) => p.name === name);
    if (prof) {
      this.selectedUserSyllabus = name;
      this.selectedUserSyllabusSubjects = prof.subjects ? Object.values(prof.subjects) : [];
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

    const subjectObject = Object.values(syllabus.subjects).find((s: ISubject) => s.name === subjectName);
    
    if (subjectObject && subjectObject.grades) {
        this.availableGrades = subjectObject.grades;
    }
  }

  addSubjectWithGrades() {
    if (!this.selectedSyllabus || !this.selectedSubject) return;
    this.syllabusSelections[this.selectedSyllabus][this.selectedSubject] = [...this.selectedGrades];
    this.selectedSubject = null;
    this.selectedGrades = [];
  }

  getGradeNames(subject: ISubject): string {
    return subject.grades ? subject.grades.join(', ') : '';
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

  deleteSubject(profName: string, subjectToDelete: ISubject): void {
    if (!this.user || !subjectToDelete._id) {
      this.notificationService.showError("Cannot delete subject without a valid ID.");
      return;
    }

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Subject',
        message: `Are you sure you want to delete the subject "${subjectToDelete.name}" from your proficiencies?`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(
      filter(result => result === true),
      switchMap(() => {
        const userId = this.user!._id;
        return this.userService.deleteSubjectFromProficiency(userId, profName, subjectToDelete._id!);
      })
    ).subscribe({
      next: (updatedUser) => {
        this.authService.updateCurrentUserState(updatedUser);

        this.userProficiencies = updatedUser.proficiencies || [];

        if (this.selectedUserSyllabus) {
            this.onUserSyllabusSelect(this.selectedUserSyllabus);
        }
        
        this.prepopulateSyllabusSelections();
        this.notificationService.showSuccess(`Subject "${subjectToDelete.name}" deleted.`);

      },
      error: (err) => {
        console.error('Failed to delete subject', err);
        this.notificationService.showError('An error occurred while deleting the subject.');
      }
    });
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
          grades: subjectSelections[subjectName]
        };
      });

      return {
        name: syllabusName,
        subjects: subjectsAsObject,
      };
    }).filter(p => Object.keys(p.subjects).length > 0);

    if (this.isSaveDisabled()) {
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
      switchMap(async () => {
        const userId = this.user!._id;
        let finalUpdatedUser: IUser | null = null;

        for (const prof of proficienciesToSave) {
          finalUpdatedUser = await lastValueFrom(this.userService.updateUserProficiency(userId, prof));
        }
        return finalUpdatedUser;
      })
    ).subscribe({
      next: (finalUpdatedUser) => {
        if (finalUpdatedUser) {
          this.authService.updateCurrentUserState(finalUpdatedUser);
          this.notificationService.showSuccess('Proficiencies updated successfully!');
          this.dialogRef.close(true);
        } else {
           this.notificationService.showError('Could not confirm proficiency updates.');
        }
      },
      error: (err) => {
        console.error('Failed to update proficiencies', err);
        this.notificationService.showError('An error occurred while saving.');
      }
    });
}
}
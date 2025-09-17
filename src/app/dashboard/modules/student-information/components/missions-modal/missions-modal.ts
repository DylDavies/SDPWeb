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
import { MissionService } from '../../../../../services/missions-service';

@Component({
  selector: 'app-missions-modal',
  imports: [CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatSelectModule],
  templateUrl: './missions-modal.html',
  styleUrl: './missions-modal.scss'
})
export class MissionsModal implements OnInit {
  private fb = inject(FormBuilder);
  private missionService = inject(MissionService);
  private notificationService = inject(NotificationService);
  private userService = inject(UserService);
  public dialogRef = inject(MatDialogRef<MissionsModal>);

  public createMissionForm: FormGroup;
  public isSaving = false;

  public studentNameCtrl = new FormControl('', [Validators.required]);
  public filteredStudents$: Observable<IUser[]>;
  public filteredTutors$: Observable<IUser[]>[] = [];

  constructor() {
    this.createMissionForm = this.fb.group({
      student: ['', Validators.required],
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
  }
  ngOnInit(): void {
    this.userService.fetchAllUsers().subscribe();
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
    this.createMissionForm.get('student')?.setValue(selectedStudentId);
  }
  onTutorSelected(event: MatAutocompleteSelectedEvent, index: number): void {
    const selectedTutorId = event.option.value._id;
    this.createMissionForm.get('tutor')?.setValue(selectedTutorId);
  }
  nCancel(): void {
    this.dialogRef.close();
  }

  onCreate(): void {
    if (this.createMissionForm.invalid || this.isSaving) {
      return;
    }
    this.isSaving = true;
    
    const payload = {
        student: this.createMissionForm.value.student,
        tutor: this.createMissionForm.value.tutor,
        dateCompleted: this.createMissionForm.value.dateCompleted,
        document: this.createMissionForm.value.document
    };

    this.missionService.createMission(payload.student).subscribe({
      next: (newMission) => {
        this.notificationService.showSuccess('Mission added successfully!');
        this.dialogRef.close(newMission);
      },
      error: (err) => {
        this.isSaving = false;
        this.notificationService.showError(err.error?.message || 'Failed to add mission.');
      }
    });
  }
}

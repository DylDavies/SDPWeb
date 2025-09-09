import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule, MatSelectionListChange } from '@angular/material/list';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';

import { ProficiencyService } from '../../../../../services/proficiency-service';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../../../models/interfaces/ISubject.interface';
import { SnackBarService } from '../../../../../services/snackbar-service';
import { ConfirmationDialog } from '../../../../../shared/components/confirmation-dialog/confirmation-dialog';
import { AdminSubjectEditDialog } from '../admin-subject-edit-dialog/admin-subject-edit-dialog';
import { EditNameDialog } from '../edit-name-dialog/edit-name-dialog';

@Component({
  selector: 'app-admin-proficiency-management',
  standalone: true,
  imports: [
    CommonModule,
    MatListModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    FormsModule
  ],
  templateUrl: './admin-proficiency-management.html',
  styleUrls: ['./admin-proficiency-management.scss']
})
export class AdminProficiencyManagement implements OnInit {
  private proficiencyService = inject(ProficiencyService);
  private snackbarService = inject(SnackBarService);
  private dialog = inject(MatDialog);

  public proficiencies$: Observable<IProficiency[]>;
  public selectedProficiency: IProficiency | null = null;
  public newProficiencyName = '';
  public dataSource = new MatTableDataSource<ISubject>();
  public displayedColumns: string[] = ['name', 'grades', 'actions'];

  constructor() {
    this.proficiencies$ = this.proficiencyService.allProficiencies$;
  }

  ngOnInit(): void {
    this.proficiencyService.fetchAllProficiencies().subscribe();
  }

  onProficiencySelected(event: MatSelectionListChange): void {
    this.selectedProficiency = event.options[0].value;
    this.dataSource.data = this.selectedProficiency ? Object.values(this.selectedProficiency.subjects) : [];
  }

  addProficiency(): void {
    if (!this.newProficiencyName.trim()) {
      return;
    }
    const newProf: Partial<IProficiency> = { name: this.newProficiencyName.trim(), subjects: {} };
    this.proficiencyService.addOrUpdateProficiency(newProf).subscribe(() => {
      this.snackbarService.showSuccess(`Proficiency '${this.newProficiencyName}' added successfully.`);
      this.newProficiencyName = '';
    });
  }
  
  editProficiencyName(): void {
    if (!this.selectedProficiency || !this.selectedProficiency._id) return;
    const dialogRef = this.dialog.open(EditNameDialog, {
      width: '400px',
      data: { name: this.selectedProficiency.name }
    });

    dialogRef.afterClosed().pipe(filter(newName => newName)).subscribe(newName => {
      this.proficiencyService.updateProficiencyName(this.selectedProficiency!._id!, newName).subscribe({
        next: () => this.snackbarService.showSuccess('Proficiency name updated.'),
        error: () => this.snackbarService.showError('Failed to update name.')
      });
    });
  }

  deleteProficiency(): void {
    if (!this.selectedProficiency || !this.selectedProficiency._id) return;

    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Proficiency',
        message: `Are you sure you want to delete "${this.selectedProficiency.name}"? This action is permanent.`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result)).subscribe(() => {
      this.proficiencyService.deleteProficiency(this.selectedProficiency!._id!).subscribe({
        next: () => {
          this.snackbarService.showSuccess('Proficiency deleted.');
          this.selectedProficiency = null;
          this.dataSource.data = [];
        },
        error: () => this.snackbarService.showError('Failed to delete proficiency.')
      });
    });
  }

  openSubjectDialog(subject?: ISubject): void {
    if (!this.selectedProficiency || !this.selectedProficiency._id) return;

    const dialogRef = this.dialog.open(AdminSubjectEditDialog, {
      width: '500px',
      data: { subject }
    });

    dialogRef.afterClosed().pipe(filter(result => result)).subscribe((result: ISubject) => {
      this.proficiencyService.addOrUpdateSubject(this.selectedProficiency!._id!, result).subscribe({
        next: (updatedProf) => {
          const action = subject ? 'updated' : 'added';
          this.snackbarService.showSuccess(`Subject ${action}.`);
          this.selectedProficiency = updatedProf;
          this.dataSource.data = Object.values(updatedProf.subjects);
        },
        error: () => this.snackbarService.showError('Failed to save subject.')
      });
    });
  }

  deleteSubject(subject: ISubject): void {
    if (!this.selectedProficiency || !this.selectedProficiency._id || !subject._id) return;
  
    const dialogRef = this.dialog.open(ConfirmationDialog, {
      data: {
        title: 'Delete Subject',
        message: `Delete "${subject.name}" from "${this.selectedProficiency.name}"?`,
        confirmText: 'Delete',
        color: 'warn'
      }
    });

    dialogRef.afterClosed().pipe(filter(result => result)).subscribe(() => {
      const subjectKey = subject.name.toLowerCase().replace(/\s+/g, '_');
      this.proficiencyService.deleteSubject(this.selectedProficiency!._id!, subjectKey).subscribe({
        next: (updatedProf) => {
          this.snackbarService.showSuccess('Subject deleted.');
          this.selectedProficiency = updatedProf;
          this.dataSource.data = Object.values(updatedProf.subjects);
        },
        error: () => this.snackbarService.showError('Failed to delete subject.')
      });
    });
  }
}
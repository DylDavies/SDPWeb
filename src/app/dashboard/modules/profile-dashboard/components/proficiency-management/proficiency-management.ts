// proficiency-management.ts
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTabsModule } from '@angular/material/tabs';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule, MatAutocompleteSelectedEvent } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatOptionModule } from '@angular/material/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatChipGrid } from '@angular/material/chips';
import { IProficiency } from '../../../../../models/interfaces/IProficiency.interface';
import { ProficiencyService } from '../../../../../services/proficiency-service';

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
    MatChipGrid
  ],
  templateUrl: './proficiency-management.html',
  styleUrls: ['./proficiency-management.scss'],
})
export class ProficiencyManagement implements OnInit {
  public dialogRef = inject(MatDialogRef<ProficiencyManagement>);

  // Test data is now correctly defined as a class property
  proficiencies = [
    {
      name: "Cambridge",
      subjects: [
        { name: "Mathematics", grade: "12" },
        { name: "Physics", grade: "12" },
        { name: "Information Technology", grade: "11" }
      ]
    },
    {
      name: "Oxford",
      subjects: [
        { name: "Biology", grade: "10" },
        { name: "Chemistry", grade: "11" }
      ]
    }
  ];

  selectedSyllabus: string | null = null;
  // This property will hold the subjects for the current view
  selectedSyllabusSubjects: any[] = [];
  availableSubjects = ["Mathematics", "Physics", "Chemistry", "Biology", "IT"];
  selectedSubjects: string[] = [];


  // Testing:
  profs: IProficiency[] = [];

  constructor(private profService: ProficiencyService){};

  ngOnInit(): void {
    if (this.proficiencies.length > 0) {
      this.onSyllabusSelect(this.proficiencies[0].name);
    }

    // testing prof service
     this.profService.fetchAllProficiencies().subscribe({
      next: (data) => {
        this.profs = data;
        console.log('Proficiencies from backend:', data);
      },
      error: (err) => console.error('Error fetching proficiencies:', err)
    });
  }

  onSyllabusSelect(name: string) {
    const prof = this.proficiencies.find(p => p.name === name);
    if (prof) {
      this.selectedSyllabus = name;
      // Populate the new property with the found subjects
      this.selectedSyllabusSubjects = prof.subjects;
      // Also update the subjects for the edit tab
      this.selectedSubjects = prof.subjects.map(s => s.name);
    }
  }

  onAutocompleteSelected(event: MatAutocompleteSelectedEvent) {
    const value = event.option.value;
    if (value && !this.selectedSubjects.includes(value)) {
      this.selectedSubjects.push(value);
    }
  }

  addSubject(event: MatChipInputEvent) {
    const value = (event.value || '').trim();
    if (value && !this.selectedSubjects.includes(value)) {
      this.selectedSubjects.push(value);
    }
    if (event.chipInput) {
      event.chipInput.clear();
    }
  }

  removeSubject(subject: string) {
    this.selectedSubjects = this.selectedSubjects.filter(s => s !== subject);
  }

  confirmSave() {
    console.log("Saving changes:", this.selectedSubjects);
    this.dialogRef.close(this.selectedSubjects);
  }
}
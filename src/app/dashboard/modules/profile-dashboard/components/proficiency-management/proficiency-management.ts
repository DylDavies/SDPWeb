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
  // proficiencies = [
  //   {
  //     name: "Cambridge",
  //     subjects: [
  //       { name: "Mathematics", grade: "12" },
  //       { name: "Physics", grade: "12" },
  //       { name: "Information Technology", grade: "11" }
  //     ]
  //   },
  //   {
  //     name: "Oxford",
  //     subjects: [
  //       { name: "Biology", grade: "10" },
  //       { name: "Chemistry", grade: "11" }
  //     ]
  //   }
  // ];

  proficiencies: IProficiency[] = []; // hold all the data regarding profs
  selectedSyllabus: string | null = null;
  selectedSyllabusSubjects: any[] = [];
  availableSubjects: string[] = [];
  selectedSubjects: string[] = [];

  // Testing:
  constructor(private profService: ProficiencyService){};

ngOnInit(): void {
  this.profService.fetchAllProficiencies().subscribe({
    next: (data) => {
      // Make sure each prof.subjects is an array
      this.proficiencies = data.map((prof) => ({
        ...prof,
        subjects: Object.values(prof.subjects) // turn object → array
      }));

      // build unique list of subject names
      this.availableSubjects = Array.from(
        new Set(
          this.proficiencies.flatMap((prof) =>
            prof.subjects.map((s: any) => s.name)
          )
        )
      );

      // select first syllabus
      if (this.proficiencies.length > 0) {
        this.onSyllabusSelect(this.proficiencies[0].name);
      }

      console.log("loaded proficiencies: ", this.proficiencies);
      console.log("available subjects: ", this.availableSubjects);
    },
    error: (err) => console.error('Error fetching proficiencies:', err)
  });
}

onSyllabusSelect(name: string) {
  const prof = this.proficiencies.find((p) => p.name === name);
  if (prof) {
    //this.selectedSyllabus = name;

    // already ensured subjects is an array
    this.selectedSyllabusSubjects = prof.subjects;

    // also update selected subjects
    this.selectedSubjects = prof.subjects.map((s: any) => s.name);
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
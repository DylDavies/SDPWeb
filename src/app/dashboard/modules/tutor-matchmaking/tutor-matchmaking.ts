import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSelectModule } from '@angular/material/select';
import { AddressAutocompleteComponent } from '../../../shared/components/address-autocomplete/address-autocomplete';
import { MatchmakingService, MatchedTutor } from '../../../services/matchmaking-service';
import { IAddress } from '../../../models/interfaces/IAddress.interface';
import { ProficiencyService } from '../../../services/proficiency-service';
import { IProficiency } from '../../../models/interfaces/IProficiency.interface';
import { ISubject } from '../../../models/interfaces/ISubject.interface';
import { SnackBarService } from '../../../services/snackbar-service';

@Component({
  selector: 'app-tutor-matchmaking',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
    MatSelectModule,
    AddressAutocompleteComponent
  ],
  templateUrl: './tutor-matchmaking.html',
  styleUrl: './tutor-matchmaking.scss'
})
export class TutorMatchmaking implements OnInit {
  private fb = inject(FormBuilder);
  private matchmakingService = inject(MatchmakingService);
  private proficiencyService = inject(ProficiencyService);
  private snackbarService = inject(SnackBarService);

  public searchForm: FormGroup;
  public isSearching = false;
  public hasSearched = false;
  public matchedTutors: MatchedTutor[] = [];
  public selectedAddress?: IAddress;

  public proficiencies: IProficiency[] = [];
  public subjects: ISubject[] = [];
  public grades: string[] = [];
  public selectedProficiency?: string;
  public selectedSubject?: string;

  public displayedColumns: string[] = ['displayName', 'email', 'location', 'proficiencies', 'availability', 'distance'];

  constructor() {
    this.searchForm = this.fb.group({
      proficiency: [''],
      subject: [''],
      grade: [''],
      hoursPerWeek: [0, [Validators.required, Validators.min(1)]],
      maxDistance: [null] // No distance limit by default
    });
  }

  ngOnInit(): void {
    this.loadProficiencies();
  }

  loadProficiencies(): void {
    this.proficiencyService.fetchAllProficiencies().subscribe({
      next: (proficiencies) => {
        this.proficiencies = proficiencies;
      },
      error: (err) => {
        console.error('Failed to load proficiencies:', err);
        this.snackbarService.showError('Failed to load proficiencies.');
      }
    });
  }

  onProficiencyChange(proficiencyName: string): void {
    this.selectedProficiency = proficiencyName;
    const proficiency = this.proficiencies.find(p => p.name === proficiencyName);

    if (proficiency && proficiency.subjects) {
      this.subjects = Object.values(proficiency.subjects);
    } else {
      this.subjects = [];
    }

    // Reset subject and grade selection when proficiency changes
    this.searchForm.patchValue({ subject: '', grade: '' });
    this.grades = [];
  }

  onSubjectChange(subjectName: string): void {
    this.selectedSubject = subjectName;
    const subject = this.subjects.find(s => s.name === subjectName);

    if (subject && subject.grades) {
      this.grades = subject.grades;
    } else {
      this.grades = [];
    }

    // Reset grade selection when subject changes
    this.searchForm.patchValue({ grade: '' });
  }

  onAddressSelected(address: IAddress | undefined): void {
    this.selectedAddress = address;
  }

  onSearch(): void {
    if (!this.searchForm.valid) {
      this.snackbarService.showError('Please fill in the hours per week (required field).');
      return;
    }

    if (!this.selectedAddress) {
      this.snackbarService.showError('Please provide a lesson location for distance calculation.');
      return;
    }

    this.isSearching = true;
    this.hasSearched = false;

    const criteria = {
      lessonLocation: this.selectedAddress,
      subject: this.searchForm.value.subject || undefined,
      proficiency: this.searchForm.value.proficiency || undefined,
      grade: this.searchForm.value.grade || undefined,
      hoursPerWeek: this.searchForm.value.hoursPerWeek,
      maxDistance: this.searchForm.value.maxDistance || undefined
    };

    this.matchmakingService.findMatchingTutors(criteria).subscribe({
      next: (response) => {
        this.matchedTutors = response.tutors;
        this.hasSearched = true;
        this.isSearching = false;

        if (this.matchedTutors.length === 0) {
          this.snackbarService.showInfo('No tutors found matching your criteria. Try adjusting your search parameters.');
        } else {
          this.snackbarService.showSuccess(`Found ${this.matchedTutors.length} matching tutor(s)!`);
        }
      },
      error: (err) => {
        console.error('Matchmaking error:', err);
        this.isSearching = false;
        this.hasSearched = true;
        this.snackbarService.showError('Failed to find matching tutors. Please try again.');
      }
    });
  }

  resetSearch(): void {
    this.searchForm.reset({
      proficiency: '',
      subject: '',
      grade: '',
      hoursPerWeek: 0,
      maxDistance: null
    });
    this.selectedAddress = undefined;
    this.subjects = [];
    this.grades = [];
    this.matchedTutors = [];
    this.hasSearched = false;
  }

  formatDistance(distance: number | null): string {
    if (distance === null) {
      return 'Unknown';
    }
    return `${distance.toFixed(1)} km`;
  }

  formatProficiencies(proficiencies: IProficiency[]): string {
    if (!proficiencies || proficiencies.length === 0) {
      return 'None';
    }
    return proficiencies.map(p => p.name).join(', ');
  }

  formatLocation(address: IAddress | undefined): string {
    if (!address) {
      return 'Not specified';
    }
    if (address.formattedAddress) {
      return address.formattedAddress;
    }
    const parts = [address.city, address.state, address.postalCode].filter(p => p);
    return parts.length > 0 ? parts.join(', ') : 'Not specified';
  }
}

import { Component, EventEmitter, Input, OnInit, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { IAddress } from '../../../models/interfaces/IBundle.interface';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
import { Observable, of } from 'rxjs';

interface AddressSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

@Component({
  selector: 'app-address-autocomplete',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressSpinnerModule,
    MatAutocompleteModule,
    MatIconModule
  ],
  templateUrl: './address-autocomplete.html',
  styleUrls: ['./address-autocomplete.scss']
})
export class AddressAutocompleteComponent implements OnInit {
  @Input() initialAddress?: IAddress;
  @Input() label = 'Lesson Location';
  @Input() placeholder = 'Enter address';
  @Input() required = false;
  @Output() addressSelected = new EventEmitter<IAddress | undefined>();

  private http = inject(HttpClient);

  public searchCtrl = new FormControl('');
  public isValidating = false;
  public isSearching = false;
  public currentAddress?: IAddress;
  public suggestions$!: Observable<AddressSuggestion[]>;

  ngOnInit(): void {
    // Set validators based on required input
    if (this.required) {
      this.searchCtrl.setValidators([Validators.required]);
    }

    // Set initial value if provided
    if (this.initialAddress?.formattedAddress) {
      this.searchCtrl.setValue(this.initialAddress.formattedAddress);
      this.currentAddress = this.initialAddress;
    }

    // Setup autocomplete with debouncing
    this.suggestions$ = this.searchCtrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(value => {
        if (typeof value !== 'string' || value.trim().length < 3) {
          return of([]);
        }
        this.isSearching = true;
        return this.http.get<AddressSuggestion[]>(
          `${environment.apiUrl}/addresses/autocomplete?input=${encodeURIComponent(value)}`
        ).pipe(
          catchError(error => {
            console.error('Error fetching suggestions:', error);
            this.isSearching = false;
            return of([]);
          })
        );
      })
    );

    // Subscribe to stop loading spinner when results come in
    this.suggestions$.subscribe(() => {
      this.isSearching = false;
    });
  }

  public onSuggestionSelected(suggestion: AddressSuggestion): void {
    this.validateAddress(suggestion.placeId);
  }

  private validateAddress(placeId: string): void {
    this.isValidating = true;

    this.http.post<IAddress>(`${environment.apiUrl}/addresses/validate`, { placeId }).subscribe({
      next: (validatedAddress) => {
        this.currentAddress = validatedAddress;
        this.searchCtrl.setValue(validatedAddress.formattedAddress || '', { emitEvent: false });
        this.addressSelected.emit(validatedAddress);
        this.isValidating = false;
      },
      error: (error) => {
        console.error('Error validating address:', error);
        this.isValidating = false;
        this.addressSelected.emit(undefined);
      }
    });
  }

  public clearAddress(): void {
    this.searchCtrl.setValue('');
    this.currentAddress = undefined;
    this.addressSelected.emit(undefined);
  }

  public getAddress(): IAddress | undefined {
    return this.currentAddress;
  }

  public displaySuggestion(suggestion: AddressSuggestion | string): string {
    if (typeof suggestion === 'string') {
      return suggestion;
    }
    return suggestion ? suggestion.description : '';
  }

  public onInputChange(): void {
    // Clear validated address when user manually edits
    if (this.currentAddress) {
      this.currentAddress = undefined;
      this.addressSelected.emit(undefined);
    }
  }
}

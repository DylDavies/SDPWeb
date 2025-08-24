import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
// --- IMPORT these for Reactive Forms ---
import { FormControl, Validators, ReactiveFormsModule } from '@angular/forms';

// --- (Keep all your existing Angular Material imports) ---
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-leave-modal',
  standalone: true,
  imports: [
    CommonModule,
    // --- ADD ReactiveFormsModule HERE ---
    ReactiveFormsModule,
    // --- (Keep all your existing Angular Material imports) ---
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './leave-modal.html',
  styleUrls: ['./leave-modal.scss']
})
export class LeaveModal {
  // Create a FormControl for the name input.
  // The first argument is the initial value ('').
  // The second argument is an array of validators (e.g., it's required).
  nameFormControl = new FormControl('', [Validators.required]);
}
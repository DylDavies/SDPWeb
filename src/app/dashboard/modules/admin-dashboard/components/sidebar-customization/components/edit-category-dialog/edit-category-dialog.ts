import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

// --- Angular Material Imports ---
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';

// --- Needed for ngModel ---
import { FormsModule } from '@angular/forms';

// --- Define the shape of data we expect ---
import { ISidebarItem } from '../../../../../../../models/interfaces/ISidebarItem.interface';
import { ForbiddenLabelValidatorDirective } from '../../../../../../../directives/forbidden-label-validator';

export interface IEditCategoryDialogData {
  node: ISidebarItem;
  forbiddenLabels: string[];
}

@Component({
  selector: 'app-edit-category-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule, // <-- Import FormsModule
    MatButtonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    ForbiddenLabelValidatorDirective 
  ],
  templateUrl: './edit-category-dialog.html',
  styleUrl: './edit-category-dialog.scss'
})
export class EditCategoryDialog implements OnInit {
  public dialogRef = inject(MatDialogRef<EditCategoryDialog>);
  public dialogData: IEditCategoryDialogData = inject(MAT_DIALOG_DATA);

  // Create a separate object for form data binding
  public formData!: { label: string; icon: string; };

  ngOnInit(): void {
    // Initialize the form data from the injected node data
    this.formData = {
      label: this.dialogData.node.label,
      icon: this.dialogData.node.icon
    };
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    // On save, we only need to return the updated form data
    this.dialogRef.close(this.formData); 
  }
}
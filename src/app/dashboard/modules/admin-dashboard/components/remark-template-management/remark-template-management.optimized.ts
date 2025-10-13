import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CdkDragDrop, moveItemInArray, DragDropModule } from '@angular/cdk/drag-drop';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { RemarkService } from '../../../../../services/remark-service';
import { IRemarkTemplate, IRemarkField, RemarkFieldType } from '../../../../../models/interfaces/IRemark.interface';
import { MatSelectModule } from '@angular/material/select';
import { SnackBarService } from '../../../../../services/snackbar-service';

/**
 * OPTIMIZED VERSION: Replaced lodash with native methods
 * - Removed entire lodash import (saves ~70KB)
 * - Using structuredClone for deep cloning
 * - Using JSON.stringify for deep equality check
 */
@Component({
  selector: 'app-remark-template-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    DragDropModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './remark-template-management.html',
  styleUrls: ['./remark-template-management.scss']
})
export class RemarkTemplateManagement implements OnInit {
  private remarkService = inject(RemarkService);
  private snackBarService = inject(SnackBarService);

  public template: IRemarkTemplate | null = null;
  public fields: IRemarkField[] = [];
  public newFieldName = '';
  public newFieldType: RemarkFieldType = 'string';
  public fieldTypes: RemarkFieldType[] = ['string', 'boolean', 'number', 'time'];
  private initialFields: IRemarkField[] = [];

  ngOnInit(): void {
    this.loadActiveTemplate();
  }

  loadActiveTemplate(): void {
    this.remarkService.getActiveTemplate().subscribe(template => {
        if (template) {
            this.template = template;
            // OPTIMIZED: Use structuredClone instead of lodash cloneDeep
            this.fields = structuredClone(template.fields);
            this.initialFields = structuredClone(template.fields);
        }
    });
  }

  drop(event: CdkDragDrop<IRemarkField[]>) {
    moveItemInArray(this.fields, event.previousIndex, event.currentIndex);
  }

  addField(): void {
    const fieldName = this.newFieldName.trim();
    if (fieldName && !this.fields.some(f => f.name === fieldName)) {
      this.fields.push({ name: fieldName, type: this.newFieldType });
      this.newFieldName = '';
      this.newFieldType = 'string';
    } else if (fieldName) {
      this.snackBarService.showError(`Field "${fieldName}" already exists.`);
    }
  }

  removeField(fieldToRemove: IRemarkField): void {
    this.fields = this.fields.filter(field => field.name !== fieldToRemove.name);
  }

  isSaveDisabled(): boolean {
    // OPTIMIZED: Use JSON.stringify for deep equality instead of lodash isEqual
    return JSON.stringify(this.fields) === JSON.stringify(this.initialFields);
  }

  saveChanges(): void {
    if (this.template) {
      this.remarkService.updateTemplate(this.fields).subscribe({
        next: () => {
          this.snackBarService.showSuccess('New remark template version created successfully!');
          this.loadActiveTemplate();
        },
        error: (err) => {
          this.snackBarService.showError(err.error?.message || 'Failed to update template.');
        }
      });
    }
  }
}

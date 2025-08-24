/**
 * @file This file contains the logic for the Bundle Dashboard component,
 * which provides a user interface for managing tutoring bundles.
 */

import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatDividerModule } from '@angular/material/divider';
import { NotificationService } from '../../../services/notification-service';
import { EBundleStatus } from '../../../models/enums/bundle-status.enum';
import { BundleService } from '../../../services/bundle-service';

@Component({
  selector: 'app-bundle-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatDividerModule
  ],
  templateUrl: './bundle-dashboard.html',
  styleUrls: ['./bundle-dashboard.scss']
})
export class BundleDashboard {
  /**
   * We're injecting all the services we need.
   * FormBuilder helps us create complex forms.
   * BundleService talks to our backend.
   * NotificationService shows success/error messages.
   */
  private fb = inject(FormBuilder);
  private bundleService = inject(BundleService);
  private notificationService = inject(NotificationService);

  /**
   * The form group for creating a new bundle.
   * It includes a student ID and a FormArray for subjects.
   */
  public createBundleForm: FormGroup;

  /**
   * A simple form for adding a subject to an existing bundle.
   */
  public addSubjectForm: FormGroup;

  /**
   * A form for managing an existing bundle by its ID.
   * This is used for deleting subjects and updating statuses.
   */
  public manageBundleForm: FormGroup;

  /**
   * We need to access the EBundleStatus enum in our template for the status dropdown.
   */
  public EBundleStatus = EBundleStatus;

  constructor() {
    // Initialize the form to create a new bundle
    this.createBundleForm = this.fb.group({
      student: ['', Validators.required],
      subjects: this.fb.array([this.createSubjectGroup()])
    });

    // Initialize the form for adding a subject
    this.addSubjectForm = this.fb.group({
      bundleId: ['', Validators.required],
      subject: ['', Validators.required],
      tutor: ['', Validators.required],
      hours: [0, [Validators.required, Validators.min(1)]]
    });

    // Initialize the form for managing a bundle
    this.manageBundleForm = this.fb.group({
      bundleId: ['', Validators.required],
      subjectIdToDelete: [''],
      status: [EBundleStatus.PENDING],
      isActive: [true]
    });
  }

  /**
   * A getter to easily access the 'subjects' FormArray from the template.
   */
  get subjects(): FormArray {
    return this.createBundleForm.get('subjects') as FormArray;
  }

  /**
   * Creates a new FormGroup for a single subject.
   * This is used when adding a new subject to the 'createBundleForm'.
   */
  createSubjectGroup(): FormGroup {
    return this.fb.group({
      subject: ['', Validators.required],
      tutor: ['', Validators.required],
      hours: [0, [Validators.required, Validators.min(1)]]
    });
  }

  /**
   * Adds a new, empty subject form group to the 'subjects' FormArray.
   */
  addSubject(): void {
    this.subjects.push(this.createSubjectGroup());
  }

  /**
   * Removes a subject form group from the 'subjects' FormArray at a specific index.
   * @param index The index of the subject to remove.
   */
  removeSubject(index: number): void {
    this.subjects.removeAt(index);
  }

  /**
   * Handles the submission of the 'Create Bundle' form.
   * Calls the BundleService and shows a notification.
   */
  onCreateBundle(): void {
    if (this.createBundleForm.invalid) {
      this.notificationService.showError('Please fill out all fields for the new bundle.');
      return;
    }
    const { student, subjects } = this.createBundleForm.value;
    this.bundleService.createBundle(student, subjects).subscribe({
      next: (bundle) => {
        this.notificationService.showSuccess(`Bundle created successfully! ID: ${bundle._id}`);
        this.createBundleForm.reset();
        this.subjects.clear();
        this.addSubject();
      },
      error: (err) => this.notificationService.showError(err.error?.message || 'Failed to create bundle.')
    });
  }

  /**
   * Handles the submission of the 'Add Subject' form.
   */
  onAddSubjectToBundle(): void {
    if (this.addSubjectForm.invalid) {
      this.notificationService.showError('Please fill out all fields to add a subject.');
      return;
    }
    const { bundleId, ...subject } = this.addSubjectForm.value;
    this.bundleService.addSubjectToBundle(bundleId, subject).subscribe({
      next: () => {
        this.notificationService.showSuccess('Subject added to bundle!');
        this.addSubjectForm.reset();
      },
      error: (err) => this.notificationService.showError(err.error?.message || 'Failed to add subject.')
    });
  }

  /**
   * Handles the 'Remove Subject' button click.
   */
  onRemoveSubjectFromBundle(): void {
    const { bundleId, subjectIdToDelete } = this.manageBundleForm.value;
    if (!bundleId || !subjectIdToDelete) {
      this.notificationService.showError('Bundle ID and Subject ID are required to remove a subject.');
      return;
    }
    this.bundleService.removeSubjectFromBundle(bundleId, subjectIdToDelete).subscribe({
      next: () => this.notificationService.showSuccess('Subject removed from bundle!'),
      error: (err) => this.notificationService.showError(err.error?.message || 'Failed to remove subject.')
    });
  }

  /**
   * Handles changes to the 'isActive' slide toggle.
   */
  onSetBundleActiveStatus(): void {
    const { bundleId, isActive } = this.manageBundleForm.value;
    if (!bundleId) {
      this.notificationService.showError('Bundle ID is required to update its active status.');
      return;
    }
    this.bundleService.setBundleActiveStatus(bundleId, isActive).subscribe({
      next: () => this.notificationService.showSuccess(`Bundle active status set to ${isActive}`),
      error: (err) => this.notificationService.showError(err.error?.message || 'Failed to update status.')
    });
  }

  /**
   * Handles the 'Update Status' button click.
   */
  onSetBundleStatus(): void {
    const { bundleId, status } = this.manageBundleForm.value;
     if (!bundleId) {
      this.notificationService.showError('Bundle ID is required to update its status.');
      return;
    }
    this.bundleService.setBundleStatus(bundleId, status).subscribe({
      next: () => this.notificationService.showSuccess(`Bundle status updated to ${status}`),
      error: (err) => this.notificationService.showError(err.error?.message || 'Failed to update status.')
    });
  }
}
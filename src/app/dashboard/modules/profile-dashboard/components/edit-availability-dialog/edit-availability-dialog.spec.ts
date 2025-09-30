import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ReactiveFormsModule, Validators } from '@angular/forms';
import { By } from '@angular/platform-browser';

import { EditAvailabilityDialog } from './edit-availability-dialog';
import { SnackBarService } from '../../../../../services/snackbar-service';

describe('EditAvailabilityDialog', () => {
  let component: EditAvailabilityDialog;
  let fixture: ComponentFixture<EditAvailabilityDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditAvailabilityDialog>>;
  let mockSnackbarService: jasmine.SpyObj<SnackBarService>;

  // Function to setup TestBed for different data scenarios
  const setupTestBed = async (data: { availability: number }) => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);
    mockSnackbarService = jasmine.createSpyObj('SnackBarService', ['showError', 'showInfo']);

    await TestBed.configureTestingModule({
      imports: [
        EditAvailabilityDialog,
        NoopAnimationsModule,
        ReactiveFormsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
        { provide: SnackBarService, useValue: mockSnackbarService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditAvailabilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  };

  describe('Component Initialization', () => {
    beforeEach(async () => {
      await setupTestBed({ availability: 25 });
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });
  });
});

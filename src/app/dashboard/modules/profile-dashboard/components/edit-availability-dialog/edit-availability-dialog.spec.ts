import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditAvailabilityDialog } from './edit-availability-dialog';

describe('EditAvailabilityDialog', () => {
  let component: EditAvailabilityDialog;
  let fixture: ComponentFixture<EditAvailabilityDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        EditAvailabilityDialog,
        NoopAnimationsModule
      ],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { availability: 0 } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAvailabilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AdminSubjectEditDialog } from './admin-subject-edit-dialog';

describe('AdminSubjectEditDialog', () => {
  let component: AdminSubjectEditDialog;
  let fixture: ComponentFixture<AdminSubjectEditDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubjectEditDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminSubjectEditDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
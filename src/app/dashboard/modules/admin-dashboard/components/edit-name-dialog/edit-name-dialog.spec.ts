import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditNameDialog } from './edit-name-dialog';

describe('EditNameDialog', () => {
  let component: EditNameDialog;
  let fixture: ComponentFixture<EditNameDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNameDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Test Name' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditNameDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
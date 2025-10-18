import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditNameDialog } from './edit-name-dialog';

describe('EditNameDialog', () => {
  let component: EditNameDialog;
  let fixture: ComponentFixture<EditNameDialog>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<EditNameDialog>>;

  beforeEach(async () => {
    const dialogRefSpy = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EditNameDialog, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: { name: 'Test Name' } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditNameDialog);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditNameDialog>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should close dialog when onCancel is called', () => {
    component.onCancel();
    expect(dialogRef.close).toHaveBeenCalled();
  });

  it('should close dialog with name when onSave is called', () => {
    component.name = 'New Name';
    component.onSave();
    expect(dialogRef.close).toHaveBeenCalledWith('New Name');
  });
});
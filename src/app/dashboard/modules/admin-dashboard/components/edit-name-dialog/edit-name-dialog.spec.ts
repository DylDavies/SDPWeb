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

    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditNameDialog>>;
    fixture = TestBed.createComponent(EditNameDialog);
    component = fixture.componentInstance;
    dialogRef = TestBed.inject(MatDialogRef) as jasmine.SpyObj<MatDialogRef<EditNameDialog>>;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('onSave', () => {
    it('should close dialog with trimmed name when name is valid', () => {
      component.name = '  John Doe  ';
      component.onSave();

      expect(dialogRef.close).toHaveBeenCalledWith('John Doe');
    });

    it('should not close dialog when name is empty', () => {
      component.name = '';
      component.onSave();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });

    it('should not close dialog when name is only whitespace', () => {
      component.name = '   ';
      component.onSave();

      expect(dialogRef.close).not.toHaveBeenCalled();
    });
  });
});
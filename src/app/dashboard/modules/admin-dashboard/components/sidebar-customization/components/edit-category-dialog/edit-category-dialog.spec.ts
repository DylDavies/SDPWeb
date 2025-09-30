import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { EditCategoryDialog } from './edit-category-dialog';

describe('EditCategoryDialog', () => {
  let component: EditCategoryDialog;
  let fixture: ComponentFixture<EditCategoryDialog>;
  
  // Mock for the dialog reference
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<EditCategoryDialog>>;
  
  // Mock data to be injected
  const mockDialogData = { 
    node: { label: 'Test Category', icon: 'folder' }, 
    forbiddenLabels: ['Home', 'Profile'] 
  };

  beforeEach(async () => {
    // Create a spy object for MatDialogRef with a 'close' method
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      // Import the component itself and NoopAnimationsModule to handle animations
      imports: [EditCategoryDialog, NoopAnimationsModule],
      providers: [
        // Provide the mock spy object for MatDialogRef
        { provide: MatDialogRef, useValue: mockDialogRef },
        // Provide the mock data for MAT_DIALOG_DATA
        { provide: MAT_DIALOG_DATA, useValue: mockDialogData }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditCategoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges(); // This triggers ngOnInit
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initialization (ngOnInit)', () => {
    it('should initialize formData with the data from MAT_DIALOG_DATA', () => {
      // Assert that the formData was set correctly based on the mock data
      expect(component.formData).toBeDefined();
      expect(component.formData.label).toBe(mockDialogData.node.label);
      expect(component.formData.icon).toBe(mockDialogData.node.icon);
    });
  });

  describe('Dialog Actions', () => {
    it('should call dialogRef.close with no arguments on onCancel()', () => {
      // Call the method
      component.onCancel();
      
      // Expect that the close method on our mock dialog ref was called without any parameters
      expect(mockDialogRef.close).toHaveBeenCalledWith();
    });

    it('should call dialogRef.close with the current formData on onSave()', () => {
      // Modify the form data to ensure it's sending the current state
      component.formData.label = 'Updated Label';
      component.formData.icon = 'updated_icon';

      // Call the method
      component.onSave();

      // Expect that the close method was called with the modified formData object
      expect(mockDialogRef.close).toHaveBeenCalledWith({
        label: 'Updated Label',
        icon: 'updated_icon'
      });
    });
  });
});
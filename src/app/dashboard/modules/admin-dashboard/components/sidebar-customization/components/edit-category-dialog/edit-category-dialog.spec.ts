import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

import { EditCategoryDialog } from './edit-category-dialog';

describe('EditCategoryDialog', () => {
  let component: EditCategoryDialog;
  let fixture: ComponentFixture<EditCategoryDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditCategoryDialog],
      providers: [
        { provide: MatDialogRef, useValue: { close: () => {} } },
        { 
          provide: MAT_DIALOG_DATA, 
          useValue: { 
            node: { label: 'Test Category', icon: 'folder' }, 
            forbiddenLabels: [] 
          } 
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditCategoryDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditNameDialog } from './edit-name-dialog';

describe('EditNameDialog', () => {
  let component: EditNameDialog;
  let fixture: ComponentFixture<EditNameDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditNameDialog]
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

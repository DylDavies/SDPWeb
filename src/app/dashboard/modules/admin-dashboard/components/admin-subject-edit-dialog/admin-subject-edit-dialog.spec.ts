import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminSubjectEditDialog } from './admin-subject-edit-dialog';

describe('AdminSubjectEditDialog', () => {
  let component: AdminSubjectEditDialog;
  let fixture: ComponentFixture<AdminSubjectEditDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminSubjectEditDialog]
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

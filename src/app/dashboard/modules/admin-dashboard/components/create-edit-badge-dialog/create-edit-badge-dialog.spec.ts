import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateEditBadgeDialog } from './create-edit-badge-dialog';

describe('CreateEditBadgeDialog', () => {
  let component: CreateEditBadgeDialog;
  let fixture: ComponentFixture<CreateEditBadgeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateEditBadgeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateEditBadgeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

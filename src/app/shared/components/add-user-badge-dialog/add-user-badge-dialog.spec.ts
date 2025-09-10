import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserBadgeDialog } from './add-user-badge-dialog';

describe('AddUserBadgeDialog', () => {
  let component: AddUserBadgeDialog;
  let fixture: ComponentFixture<AddUserBadgeDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserBadgeDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserBadgeDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

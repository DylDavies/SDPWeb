import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditAvailabilityDialog } from './edit-availability-dialog';

describe('EditAvailabilityDialog', () => {
  let component: EditAvailabilityDialog;
  let fixture: ComponentFixture<EditAvailabilityDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditAvailabilityDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditAvailabilityDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

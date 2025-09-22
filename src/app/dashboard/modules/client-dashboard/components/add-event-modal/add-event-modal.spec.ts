import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddEventModal } from './add-event-modal';

describe('AddEventModal', () => {
  let component: AddEventModal;
  let fixture: ComponentFixture<AddEventModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEventModal]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddEventModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

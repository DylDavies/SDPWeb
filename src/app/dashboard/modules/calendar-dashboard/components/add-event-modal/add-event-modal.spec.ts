import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { AddEventModal } from './add-event-modal';

describe('AddEventModal', () => {
  let component: AddEventModal;
  let fixture: ComponentFixture<AddEventModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddEventModal, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { date: new Date() } }
      ]
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
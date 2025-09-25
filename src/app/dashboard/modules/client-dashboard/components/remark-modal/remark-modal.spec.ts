import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

import { RemarkModal } from './remark-modal';
import { IEvent } from '../../../../../models/interfaces/IEvent.interface';

describe('RemarkModal', () => {
  let component: RemarkModal;
  let fixture: ComponentFixture<RemarkModal>;

  const mockEvent: Partial<IEvent> = {
    student: { _id: 'student1', displayName: 'Test Student' },
    tutor: { _id: 'tutor1', displayName: 'Test Tutor' },
    subject: 'Math',
    startTime: new Date(),
    duration: 60,
    remarked: false,
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemarkModal, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { event: mockEvent } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(RemarkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
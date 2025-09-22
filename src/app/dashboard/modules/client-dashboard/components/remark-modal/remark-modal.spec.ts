import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { RemarkModal } from './remark-modal';

describe('RemarkModal', () => {
  let component: RemarkModal;
  let fixture: ComponentFixture<RemarkModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RemarkModal, NoopAnimationsModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { event: {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RemarkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
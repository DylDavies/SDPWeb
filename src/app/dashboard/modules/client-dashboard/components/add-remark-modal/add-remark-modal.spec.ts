import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { AddRemarkModal } from './add-remark-modal';

describe('AddRemarkModal', () => {
  let component: AddRemarkModal;
  let fixture: ComponentFixture<AddRemarkModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddRemarkModal, NoopAnimationsModule, HttpClientTestingModule],
      providers: [
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { event: {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddRemarkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
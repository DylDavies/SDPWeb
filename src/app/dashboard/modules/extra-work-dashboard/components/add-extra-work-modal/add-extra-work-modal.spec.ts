import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { AddExtraWorkModal } from './add-extra-work-modal';

describe('AddExtraWorkModal', () => {
  let component: AddExtraWorkModal;
  let fixture: ComponentFixture<AddExtraWorkModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddExtraWorkModal],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync(),
        // Modals need mock providers for the data they receive and the reference to themselves
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddExtraWorkModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
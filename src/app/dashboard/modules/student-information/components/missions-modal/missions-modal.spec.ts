import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MissionsModal } from './missions-modal';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

describe('MissionsModal', () => {
  let component: MissionsModal;
  let fixture: ComponentFixture<MissionsModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionsModal],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MissionsModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

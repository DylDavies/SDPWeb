import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { AddUserBadgeDialogComponent } from './add-user-badge-dialog';

describe('AddUserBadgeDialog', () => {
  let component: AddUserBadgeDialogComponent;
  let fixture: ComponentFixture<AddUserBadgeDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserBadgeDialogComponent, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { user: {} } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AddUserBadgeDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
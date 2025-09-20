import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { NoopAnimationsModule } from '@angular/platform-browser/animations'; 
import { provideHttpClient } from '@angular/common/http'; 
import { provideHttpClientTesting } from '@angular/common/http/testing'; 
import { BadgeRequirementDialogComponent } from './badge-requirement-dialog'; 

describe('BadgeRequirementDialog', () => {
  let component: BadgeRequirementDialogComponent; 
  let fixture: ComponentFixture<BadgeRequirementDialogComponent>; 

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        BadgeRequirementDialogComponent, 
        NoopAnimationsModule
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: {} },
        { provide: MAT_DIALOG_DATA, useValue: { badge: {}, isEditable: false } }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BadgeRequirementDialogComponent); 
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
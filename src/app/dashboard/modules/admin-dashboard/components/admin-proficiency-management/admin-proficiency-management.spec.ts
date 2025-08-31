import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';

import { AdminProficiencyManagement } from './admin-proficiency-management';

describe('AdminProficiencyManagement', () => {
  let component: AdminProficiencyManagement;
  let fixture: ComponentFixture<AdminProficiencyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProficiencyManagement, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialog, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AdminProficiencyManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
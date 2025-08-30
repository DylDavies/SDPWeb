import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AdminProficiencyManagement } from './admin-proficiency-management';

describe('AdminProficiencyManagement', () => {
  let component: AdminProficiencyManagement;
  let fixture: ComponentFixture<AdminProficiencyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminProficiencyManagement]
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

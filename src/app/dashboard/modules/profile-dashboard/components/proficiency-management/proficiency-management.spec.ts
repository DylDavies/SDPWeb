import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProficiencyManagement } from './proficiency-management';

describe('ProficiencyManagement', () => {
  let component: ProficiencyManagement;
  let fixture: ComponentFixture<ProficiencyManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProficiencyManagement]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProficiencyManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

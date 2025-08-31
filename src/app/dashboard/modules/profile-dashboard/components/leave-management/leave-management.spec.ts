import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LeaveManagement } from './leave-management';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';


describe('LeaveManagement', () => {
  let component: LeaveManagement;
  let fixture: ComponentFixture<LeaveManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LeaveManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(LeaveManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

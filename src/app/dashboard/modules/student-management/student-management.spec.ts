import { ComponentFixture, TestBed } from '@angular/core/testing';
import { StudentManagement } from './student-management';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';

describe('StudentsTable', () => {
  let component: StudentManagement;
  let fixture: ComponentFixture<StudentManagement>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentManagement],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentManagement);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
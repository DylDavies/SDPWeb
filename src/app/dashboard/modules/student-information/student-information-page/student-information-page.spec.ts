import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StudentInformationPage } from './student-information-page';

describe('StudentInformationPage', () => {
  let component: StudentInformationPage;
  let fixture: ComponentFixture<StudentInformationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentInformationPage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StudentInformationPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StudentInformationPage } from './student-information-page';
import { ActivatedRoute, convertToParamMap } from '@angular/router';

describe('StudentInformationPage', () => {
  let component: StudentInformationPage;
  let fixture: ComponentFixture<StudentInformationPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentInformationPage, NoopAnimationsModule],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({})
            }
          }
        }
      ]
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

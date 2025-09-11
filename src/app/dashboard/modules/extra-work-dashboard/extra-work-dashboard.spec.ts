import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { ExtraWorkDashboard } from './extra-work-dashboard';

describe('ExtraWorkDashboard', () => {
  let component: ExtraWorkDashboard;
  let fixture: ComponentFixture<ExtraWorkDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ExtraWorkDashboard],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ExtraWorkDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
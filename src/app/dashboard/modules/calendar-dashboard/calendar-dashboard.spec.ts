import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { CalendarDashboard } from './calendar-dashboard';

describe('CalendarDashboard', () => {
  let component: CalendarDashboard;
  let fixture: ComponentFixture<CalendarDashboard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarDashboard],
      providers: [
        provideAnimationsAsync()
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
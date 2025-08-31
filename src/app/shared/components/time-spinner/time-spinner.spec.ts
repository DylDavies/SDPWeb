import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimeSpinner } from './time-spinner';

describe('TimeSpinner', () => {
  let component: TimeSpinner;
  let fixture: ComponentFixture<TimeSpinner>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimeSpinner]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimeSpinner);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
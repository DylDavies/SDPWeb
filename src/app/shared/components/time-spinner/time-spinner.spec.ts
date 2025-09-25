import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TimeSpinner } from './time-spinner';
import { Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  imports: [TimeSpinner, ReactiveFormsModule],
  standalone: true,
  template: `
    <app-time-spinner [formControl]="timeControl" [mode]="mode" [step]="step" [min]="min"></app-time-spinner>
  `
})
class TestHostComponent {
  timeControl = new FormControl();
  mode: 'time' | 'duration' = 'time';
  step = 1;
  min = 0;
}

describe('TimeSpinner', () => {
  let component: TestHostComponent;
  let fixture: ComponentFixture<TestHostComponent>;
  let timeSpinner: TimeSpinner;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHostComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TestHostComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    timeSpinner = fixture.debugElement.children[0].componentInstance;
  });

  it('should create', () => {
    expect(timeSpinner).toBeTruthy();
  });

  describe('Time Mode', () => {
    beforeEach(() => {
        component.mode = 'time';
        fixture.detectChanges();
    });

    it('should increment and decrement hour', () => {
      timeSpinner.hour = 10;
      timeSpinner.incrementHour();
      expect(timeSpinner.hour).toBe(11);
      timeSpinner.decrementHour();
      expect(timeSpinner.hour).toBe(10);
    });

    it('should increment and decrement minute', () => {
        timeSpinner.minute = 30;
        timeSpinner.incrementMinute();
        expect(timeSpinner.minute).toBe(31);
        timeSpinner.decrementMinute();
        expect(timeSpinner.minute).toBe(30);
      });
  
      it('should handle minute wrapping', () => {
        timeSpinner.minute = 59;
        timeSpinner.incrementMinute();
        expect(timeSpinner.minute).toBe(0);
        timeSpinner.decrementMinute();
        expect(timeSpinner.minute).toBe(59);
      });
  });

  describe('Duration Mode', () => {
    beforeEach(() => {
        component.mode = 'duration';
        component.step = 15;
        component.min = 15;
        fixture.detectChanges();
    });

    it('should increment and decrement duration hour', () => {
        timeSpinner.durationHour = 1;
        timeSpinner.incrementDurationHour();
        expect(timeSpinner.durationHour).toBe(2);
        timeSpinner.decrementDurationHour();
        expect(timeSpinner.durationHour).toBe(1);
    });

    it('should increment and decrement duration minute', () => {
        timeSpinner.durationMinute = 30;
        timeSpinner.incrementDurationMinute();
        expect(timeSpinner.durationMinute).toBe(45);
        timeSpinner.decrementDurationMinute();
        expect(timeSpinner.durationMinute).toBe(30);
    });

    it('should not decrement below min value', () => {
        timeSpinner.durationHour = 0;
        timeSpinner.durationMinute = 15;
        timeSpinner.decrementDurationMinute();
        expect(timeSpinner.durationMinute).toBe(15);
    });
  });
});
import { Component, forwardRef, Input } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-time-spinner',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatButtonModule],
  templateUrl: './time-spinner.html',
  styleUrls: ['./time-spinner.scss'],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => TimeSpinner),
      multi: true
    }
  ]
})
export class TimeSpinner implements ControlValueAccessor {
  @Input() mode: 'time' | 'duration' = 'time';
  @Input() step = 1;
  @Input() min = 0;
  @Input() max = Infinity;

  // For number mode
  public numericValue = 0;

  // For time mode
  public hour = 9;
  public minute = 0;

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onChange = (_: string | number) => {};
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  private onTouched = () => {};

  writeValue(value: string | number): void {
    if (this.mode === 'time' && typeof value === 'string') {
      const [hour, minute] = value.split(':').map(Number);
      this.hour = hour;
      this.minute = minute;
    } else if (this.mode === 'duration' && typeof value === 'number') {
      this.durationHour = Math.floor(value / 60);
      this.durationMinute = value % 60;
    }
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ... rest of the component class
  public durationHour = 0;
  public durationMinute = 15;
  // --- Methods for Time Mode ---
  incrementHour(): void {
    this.hour = (this.hour + 1) % 24;
    this.updateValue();
  }

  decrementHour(): void {
    this.hour = (this.hour - 1 + 24) % 24;
    this.updateValue();
  }

  incrementMinute(): void {
    this.minute = (this.minute + 1) % 60;
    if (this.minute === 0) this.incrementHour();
    this.updateValue();
  }

  decrementMinute(): void {
    this.minute = (this.minute - 1 + 60) % 60;
    if (this.minute === 59) this.decrementHour();
    this.updateValue();
  }

  // --- Methods for Duration Mode ---
  incrementDurationHour(): void {
    this.durationHour++;
    this.updateValue();
  }

  decrementDurationHour(): void {
    const totalMinutes = ((this.durationHour - 1) * 60) + this.durationMinute;
    if (totalMinutes >= this.min) {
        this.durationHour--;
        this.updateValue();
    }
  }

  incrementDurationMinute(): void {
    const newMinute = this.durationMinute + this.step;
    this.durationMinute = newMinute % 60;
    if (newMinute >= 60) {
        this.durationHour += Math.floor(newMinute / 60);
    }
    this.updateValue();
  }

  decrementDurationMinute(): void {
    let newMinute = this.durationMinute - this.step;
    let newHour = this.durationHour;

    while (newMinute < 0) {
        newMinute += 60;
        newHour--;
    }
    
    if (newHour >= 0) {
        const totalMinutes = (newHour * 60) + newMinute;
        if (totalMinutes >= this.min) {
            this.durationHour = newHour;
            this.durationMinute = newMinute;
            this.updateValue();
        }
    }
  }

  private updateValue(): void {
    if (this.mode === 'time') {
      const formattedHour = this.hour.toString().padStart(2, '0');
      const formattedMinute = this.minute.toString().padStart(2, '0');
      this.onChange(`${formattedHour}:${formattedMinute}`);
    } else {
      this.onChange((this.durationHour * 60) + this.durationMinute);
    }
    this.onTouched();
  }
}
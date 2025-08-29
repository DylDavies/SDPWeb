import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ETheme, ThemeService } from '../../../services/theme-service';

@Component({
  selector: 'app-theme-toggle-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonToggleModule, MatTooltipModule],
  template: `
    <mat-button-toggle-group 
      [value]="themeService.theme()" 
      (change)="setTheme($event.value)" 
      aria-label="Theme selection"
      class="theme-toggle-group">
        <mat-button-toggle value="light" matTooltip="Light Mode" aria-label="Light Mode">
            <mat-icon>light_mode</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="dark" matTooltip="Dark Mode" aria-label="Dark Mode">
            <mat-icon>dark_mode</mat-icon>
        </mat-button-toggle>
        <mat-button-toggle value="system" matTooltip="Follow System Setting" aria-label="System theme">
            <mat-icon>desktop_windows</mat-icon>
        </mat-button-toggle>
    </mat-button-toggle-group>
  `,
  styles: `
    .theme-toggle-group {
      border: 1px solid var(--mat-sys-outline-variant);
      border-radius: 24px; /* Makes the group pill-shaped */
      overflow: hidden;
      height: 40px;
    }
  `
})
export class ThemeToggleButtonComponent {
  public themeService = inject(ThemeService);

  /**
   * Sets the new theme preference.
   * @param theme The theme selected from the toggle group.
   */
  setTheme(theme: ETheme): void {
    this.themeService.setTheme(theme);
  }
}

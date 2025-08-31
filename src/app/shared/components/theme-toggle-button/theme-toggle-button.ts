import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ThemeService, Theme } from '../../../services/theme-service';

@Component({
  selector: 'app-theme-toggle-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonToggleModule, MatTooltipModule],
  templateUrl: './theme-toggle-button.html',
  styleUrl: './theme-toggle-button.scss'
})
export class ThemeToggleButton {
  public themeService = inject(ThemeService);

  /**
   * Sets the new theme preference.
   * @param theme The theme selected from the toggle group.
   */
  setTheme(theme: Theme): void {
    this.themeService.setTheme(theme);
  }
}

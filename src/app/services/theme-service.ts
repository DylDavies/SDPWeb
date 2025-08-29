import { DOCUMENT } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, effect, inject, signal } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type ETheme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private rendererFactory = inject(RendererFactory2);
  private document = inject(DOCUMENT);

  private _themeSubject: BehaviorSubject<'light' | 'dark' | null> = new BehaviorSubject<'light' | 'dark' | null>(null);

  public themeObs: Observable<'light' | 'dark' | null> = this._themeSubject.asObservable();

  // Use a signal to hold the current theme preference.
  // It reads the initial value from localStorage or defaults to 'system'.
  public theme = signal<ETheme>((localStorage.getItem('theme') as ETheme) || 'system');

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    // An effect that runs whenever the theme signal changes.
    effect(() => {
      const newTheme = this.theme();
      localStorage.setItem('theme', newTheme);
      this.updateTheme();
    });

    // Listen for changes in the user's system preferences
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => this.updateTheme());
  }

  /**
   * Applies the correct theme (light or dark) to the document body
   * based on the current theme preference and system settings.
   */
  private updateTheme(): void {
    const currentTheme = this.theme();
    let isDark = false;

    if (currentTheme === 'system') {
      // If set to 'system', use the browser's media query to decide.
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      // Otherwise, use the explicit 'dark' or 'light' setting.
      isDark = currentTheme === 'dark';
    }

    if (isDark) {
      this.renderer.addClass(this.document.body, 'dark-theme');
      this.renderer.removeClass(this.document.body, 'light-theme');
      this._themeSubject.next('dark');
    } else {
      this.renderer.addClass(this.document.body, 'light-theme');
      this.renderer.removeClass(this.document.body, 'dark-theme');
      this._themeSubject.next('light');
    }
  }

  /**
   * Sets a new theme preference.
   * @param theme The new theme to set.
   */
  public setTheme(theme: ETheme): void {
    this.theme.set(theme);
  }
}

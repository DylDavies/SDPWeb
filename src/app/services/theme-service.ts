import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { Injectable, Renderer2, RendererFactory2, effect, inject, signal, PLATFORM_ID } from '@angular/core';
import { BehaviorSubject, filter, Observable } from 'rxjs';
import { AuthService } from './auth-service';
import { UserService } from './user-service';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private renderer: Renderer2;
  private rendererFactory = inject(RendererFactory2);
  private document = inject(DOCUMENT);
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  private _themeSubject: BehaviorSubject<'light' | 'dark' | null> = new BehaviorSubject<'light' | 'dark' | null>(null);

  public themeObs: Observable<'light' | 'dark' | null> = this._themeSubject.asObservable();

  // Use a signal to hold the current theme preference.
  // It reads the initial value from localStorage or defaults to 'system'.
  public theme = signal<Theme>(this.getInitialTheme());

  constructor() {
    this.renderer = this.rendererFactory.createRenderer(null, null);

    // An effect that runs whenever the theme signal changes.
    effect(() => {
      const newTheme = this.theme();
      if (this.isBrowser) {
        localStorage.setItem('theme', newTheme);
      }
      this.updateThemeClass();
    });

    // Listen for changes in the user's system preferences (browser only)
    if (this.isBrowser) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => this.updateThemeClass());
    }

    this.authService.currentUser$.pipe(
      filter(user => !!user && !!user.theme)
    ).subscribe(user => {
      const dbTheme = user!.theme;

      if (dbTheme !== this.theme()) {
        this.theme.set(dbTheme);
      }
    })
  }

  private getInitialTheme(): Theme {
    if (!this.isBrowser) return 'system';
    return (localStorage.getItem('theme') as Theme) || 'system';
  }

  /**
   * Applies the correct theme (light or dark) to the document body
   * based on the current theme preference and system settings.
   */
  private updateThemeClass(): void {
    const currentTheme = this.theme();
    let isDark = false;

    if (currentTheme === 'system') {
      // If set to 'system', use the browser's media query to decide (browser only).
      isDark = this.isBrowser ? window.matchMedia('(prefers-color-scheme: dark)').matches : false;
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
  public setTheme(theme: Theme): void {
    this.theme.set(theme);

    this.userService.updateUserPreferences({ theme }).subscribe({
      error: (err) => console.error('Failed to save theme preference:', err)
    })
  }
}

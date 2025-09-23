import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig, MatSnackBarRef } from '@angular/material/snack-bar';

/**
 * A service for displaying snack bar notifications.
 * This service is injectable at the root level to be used across the application.
 */
@Injectable({
  providedIn: 'root'
})
export class SnackBarService {

  private snackBar = inject(MatSnackBar);

  /**
   * Displays a success notification.
   * @param message The message to display.
   */
  showSuccess(message: string): void {
    const duration = 3000;
    this.show(message, undefined, {
      panelClass: ['success-snackbar', `duration-${duration}`],
      duration: duration,
    });
  }

  /**
   * Displays an error notification.
   * @param message The message to display.
   */
  showError(message: string): void {
    const duration = 5000;
    this.show(message, undefined, {
      panelClass: ['error-snackbar', `duration-${duration}`],
      duration: duration, // Errors might need more time to be read
    });
  }

  /**
   * Displays a general information notification.
   * @param message The message to display.
   */
  showInfo(message: string): void {
    const duration = 3000;
    this.show(message, undefined, {
      panelClass: ['info-snackbar', `duration-${duration}`],
      duration: duration,
    });
  }

  /**
   * NEW: Displays a notification with a clickable action.
   * Returns a reference to the snackbar to allow subscribing to the action.
   * @param message The message to display.
   * @param action The text for the action button (e.g., 'Undo').
   * @returns MatSnackBarRef<unknown>
   */
  showWithAction(message: string, action: string): MatSnackBarRef<unknown> {
    const duration = 5000; // Give users enough time to click the action
    return this.show(message, action, {
        panelClass: ['info-snackbar', `duration-${duration}`], // Or a new custom class
        duration: duration,
    });
  }

  /**
   * The core method to open a snack bar with custom configuration.
   * @param message The message to display in the snack bar.
   * @param config The configuration object for the MatSnackBar.
   */
  private show(message: string, action: string | undefined, config: MatSnackBarConfig): MatSnackBarRef<unknown> {
    // Default configuration for all snackbars
    const defaultConfig: MatSnackBarConfig = {
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      ...config // Merge default and provided configs
    };
    // Pass 'undefined' for the action to remove the button
    return this.snackBar.open(message, action, defaultConfig);
  }
}

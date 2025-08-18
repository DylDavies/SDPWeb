import { inject, Injectable } from '@angular/core';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';

/**
 * A service for displaying snack bar notifications.
 * This service is injectable at the root level to be used across the application.
 */
@Injectable({
  providedIn: 'root'
})
export class NotificationService {

  private snackBar = inject(MatSnackBar);

  /**
   * Displays a success notification.
   * @param message The message to display.
   */
  showSuccess(message: string): void {
    const duration = 3000;
    this.show(message, {
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
    this.show(message, {
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
    this.show(message, {
      panelClass: ['info-snackbar', `duration-${duration}`],
      duration: duration,
    });
  }

  /**
   * The core method to open a snack bar with custom configuration.
   * @param message The message to display in the snack bar.
   * @param config The configuration object for the MatSnackBar.
   */
  private show(message: string, config: MatSnackBarConfig): void {
    // Default configuration for all snackbars
    const defaultConfig: MatSnackBarConfig = {
      horizontalPosition: 'end',
      verticalPosition: 'bottom',
      ...config // Merge default and provided configs
    };
    // Pass 'undefined' for the action to remove the button
    this.snackBar.open(message, undefined, defaultConfig);
  }
}

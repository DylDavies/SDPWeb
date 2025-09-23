import { TestBed } from '@angular/core/testing';
import { MatSnackBar, MatSnackBarConfig } from '@angular/material/snack-bar';
import { SnackBarService } from './snackbar-service';

// Create a spy object for MatSnackBar. This is a mock that will stand in for the real service.
const snackBarSpy = jasmine.createSpyObj('MatSnackBar', ['open']);

describe('SnackBarService', () => {
  let service: SnackBarService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        SnackBarService,
        // Provide the mock object instead of the real MatSnackBar
        { provide: MatSnackBar, useValue: snackBarSpy }
      ]
    });
    service = TestBed.inject(SnackBarService);

    // Reset the spy's call history before each test to ensure a clean slate
    snackBarSpy.open.calls.reset();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('showSuccess', () => {
    it('should call the snackbar with a success message and correct configuration', () => {
      // Arrange
      const message = 'Operation was successful!';
      const expectedConfig: MatSnackBarConfig = {
        panelClass: ['success-snackbar', 'duration-3000'],
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      };

      // Act
      service.showSuccess(message);

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledOnceWith(message, undefined, expectedConfig);
    });
  });

  describe('showError', () => {
    it('should call the snackbar with an error message and correct configuration', () => {
      // Arrange
      const message = 'An error occurred!';
      const expectedConfig: MatSnackBarConfig = {
        panelClass: ['error-snackbar', 'duration-5000'],
        duration: 5000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      };

      // Act
      service.showError(message);

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledOnceWith(message, undefined, expectedConfig);
    });
  });

  describe('showInfo', () => {
    it('should call the snackbar with an info message and correct configuration', () => {
      // Arrange
      const message = 'Here is some information.';
      const expectedConfig: MatSnackBarConfig = {
        panelClass: ['info-snackbar', 'duration-3000'],
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'bottom'
      };

      // Act
      service.showInfo(message);

      // Assert
      expect(snackBarSpy.open).toHaveBeenCalledOnceWith(message, undefined, expectedConfig);
    });
  });
});
import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth-service';
import { SnackBarService } from '../../services/snackbar-service';
import { Clipboard } from '@angular/cdk/clipboard';

@Component({
  selector: 'app-account-disabled',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './account-disabled.html',
  styleUrl: './account-disabled.scss'
})
export class AccountDisabled {
  private authService = inject(AuthService);
  private clipboard = inject(Clipboard);
  private snackbarService = inject(SnackBarService);

  public supportEmail = 'support@tutorcore.works';

  logout(): void {
    this.authService.logout();
  }

  copyEmail(): void {
    this.clipboard.copy(this.supportEmail);
    this.snackbarService.showSuccess('Support email copied to clipboard!');
  }
}

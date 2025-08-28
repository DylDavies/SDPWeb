import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-account-disabled',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './account-disabled.html',
  styleUrl: './account-disabled.scss'
})
export class AccountDisabled {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}

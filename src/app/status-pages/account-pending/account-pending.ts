import { Component, inject } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth-service';

@Component({
  selector: 'app-account-pending',
  standalone: true,
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './account-pending.html',
  styleUrl: './account-pending.scss'
})
export class AccountPending {
  private authService = inject(AuthService);

  logout(): void {
    this.authService.logout();
  }
}

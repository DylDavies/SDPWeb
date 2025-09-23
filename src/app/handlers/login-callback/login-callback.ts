import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth-service';
import { SnackBarService } from '../../services/snackbar-service';

@Component({
  selector: 'app-login-callback',
  imports: [],
  templateUrl: './login-callback.html',
  styleUrl: './login-callback.scss',
  standalone: true
})
export class LoginCallback implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);
  private snackbarService = inject(SnackBarService);

  ngOnInit(): void {
    const token = this.route.snapshot.queryParamMap.get('token');
    if (token) {
      this.authService.saveToken(token);
      this.router.navigateByUrl('/dashboard');
      this.snackbarService.showSuccess("Logged in.");
    } else {
      // Handle case where token is missing
      this.router.navigateByUrl('/'); 
      this.snackbarService.showError("An error occurred while logging in.");
    }
  }
}

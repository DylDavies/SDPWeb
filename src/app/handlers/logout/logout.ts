import { Component, inject, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { SnackBarService } from '../../services/snackbar-service';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.html',
  styleUrl: './logout.scss',
  standalone: true
})
export class Logout implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);
  private snackbarService = inject(SnackBarService);

  ngOnInit(): void {
    this.authService.logout();
    this.snackbarService.showSuccess("Logged out.")
    this.router.navigateByUrl("/");
  }
}

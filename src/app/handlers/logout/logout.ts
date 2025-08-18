import { Component } from '@angular/core';
import { AuthService } from '../../services/auth-service';
import { Router } from '@angular/router';
import { NotificationService } from '../../services/notification-service';

@Component({
  selector: 'app-logout',
  imports: [],
  templateUrl: './logout.html',
  styleUrl: './logout.scss',
  standalone: true
})
export class Logout {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notif: NotificationService
  ) {}

  ngOnInit(): void {
    this.authService.logout();
    this.notif.showSuccess("Logged out.")
    this.router.navigate(["/"]);
  }
}

import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [MatCardModule, MatButtonModule, MatIconModule],
  templateUrl: './not-found.html',
  styleUrl: './not-found.scss',
  standalone: true
})
export class NotFound implements OnInit {
  /**
   * Stores the URL path that the user tried to access.
   */
  public pathNotFound = '';

  private router = inject(Router);

  /**
   * A lifecycle hook that is called after Angular has initialized all data-bound properties.
   * We use it here to get the URL that resulted in the 404 error.
   */
  ngOnInit(): void {
    this.pathNotFound = this.router.url;
  }

  /**
   * Shows a snackbar notification and then navigates the user back to the home page ('/').
   */
  goHome(): void {
    this.router.navigateByUrl('/');
  }
}

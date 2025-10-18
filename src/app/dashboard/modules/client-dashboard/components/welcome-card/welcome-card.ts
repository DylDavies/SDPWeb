import { Component, inject, OnInit } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { SnackBarService } from '../../../../../services/snackbar-service';
import { Clipboard } from '@angular/cdk/clipboard';
import { AuthService } from '../../../../../services/auth-service';
import { UserService } from '../../../../../services/user-service';

@Component({
  selector: 'app-welcome-card',
  imports: [MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './welcome-card.html',
  styleUrl: './welcome-card.scss',
  animations: [
    trigger('cardAnimation', [
      state('visible', style({
        height: '*',
        opacity: 1,
        marginTop: '20px',
        paddingTop: '*',
        paddingBottom: '*',
        borderWidth: '1px'
      })),
      state('hidden', style({
        height: '0px',
        opacity: 0,
        marginTop: '0',
        paddingTop: '0',
        paddingBottom: '0',
        borderWidth: '0'
      })),
      transition('visible => hidden', [
        animate('400ms ease-in-out')
      ])
    ])
  ]
})
export class WelcomeCard implements OnInit {
  private clipboard = inject(Clipboard);
  private snackbarService = inject(SnackBarService);
  private authService = inject(AuthService);
  private userService = inject(UserService);

  isWelcomeCardVisible = true;
  public cardState: "visible" | "hidden" = "visible";

  public supportEmail = 'support@tutorcore.works';

  ngOnInit(): void {
    // Check if the user has already dismissed the welcome card
    this.authService.currentUser$.subscribe(user => {
      if (user?.welcomeCardDismissed) {
        this.isWelcomeCardVisible = false;
        this.cardState = "hidden";
      }
    });
  }

  closeWelcomeCard(): void {
    this.cardState = "hidden";

    // After animation completes, update the user preference in the database
    setTimeout(() => {
      this.userService.updateProfile({ welcomeCardDismissed: true }).subscribe({
        next: (updatedUser) => {
          this.isWelcomeCardVisible = false;
          // Update the current user state in AuthService
          this.authService.updateCurrentUserState(updatedUser);
        },
        error: (err) => {
          console.error('Failed to save welcome card dismissal:', err);
          // Optionally show a snackbar error
          this.snackbarService.showError('Failed to save preference');
        }
      });
    }, 400); // Match the animation duration
  }

  copyEmail(): void {
    this.clipboard.copy(this.supportEmail);
    this.snackbarService.showSuccess('Support email copied to clipboard!');
  }
}

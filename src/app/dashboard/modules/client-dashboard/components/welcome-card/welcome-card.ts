import { Component, inject } from '@angular/core';
import { MatCardModule } from "@angular/material/card";
import { MatIconModule } from "@angular/material/icon";
import { MatButtonModule } from "@angular/material/button";
import { trigger, state, style, animate, transition } from "@angular/animations";
import { SnackBarService } from '../../../../../services/snackbar-service';
import { Clipboard } from '@angular/cdk/clipboard';

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
export class WelcomeCard {
  private clipboard = inject(Clipboard);
  private snackbarService = inject(SnackBarService);

  isWelcomeCardVisible = true;
  public cardState: "visible" | "hidden" = "visible";

  public supportEmail = 'support@tutorcore.works';

  closeWelcomeCard(): void {
    this.cardState = "hidden";
  }

  copyEmail(): void {
    this.clipboard.copy(this.supportEmail);
    this.snackbarService.showSuccess('Support email copied to clipboard!');
  }
}

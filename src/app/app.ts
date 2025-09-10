import { Component, inject, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './services/theme-service';
import { NotificationService } from './services/notification-service';
import { SocketService } from './services/socket-service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('TutorCore');
  private themeService = inject(ThemeService);
  private socketService = inject(SocketService);
  private notificationService = inject(NotificationService);
}

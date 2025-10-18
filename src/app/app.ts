import { Component, inject, signal, OnInit, PLATFORM_ID } from '@angular/core';
import { Router, RouterOutlet, NavigationEnd } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { ThemeService } from './services/theme-service';
import { NotificationService } from './services/notification-service';
import { SocketService } from './services/socket-service';
import { Meta } from '@angular/platform-browser';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App implements OnInit {
  protected readonly title = signal('TutorCore');
  private themeService = inject(ThemeService);
  private socketService = inject(SocketService);
  private notificationService = inject(NotificationService);
  private router = inject(Router);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private meta = inject(Meta);

  ngOnInit() {
    // Only run in browser
    if (!this.isBrowser) return;

    this.meta.addTag({ name: 'description', content: 'TutorCore - Comprehensive staff management system for tracking employee development, badges, payslips, and professional growth.' });

    // Listen to route changes and connect socket when leaving landing page
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      // Connect socket if not on landing page
      if (event.urlAfterRedirects !== '/' && event.urlAfterRedirects !== '') {
        if (!this.socketService.isSocketConnected()) {
          console.log('Navigated away from landing page, initializing Socket.IO...');
          this.socketService.connect();
        }
      }
    });
  }
}

import { Injectable, OnDestroy, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { TOKEN_STORAGE_KEY } from './auth-service';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);
  private isConnected = false;

  constructor() {
    // Don't auto-initialize - wait for explicit connect() call
  }

  /**
   * Initializes the socket connection.
   * This should be called when navigating away from the landing page.
   */
  connect() {
    // Prevent multiple connections
    if (this.isConnected || this.socket) return;

    // Only initialize socket in browser environment
    if (!this.isBrowser) return;

    console.log('Initializing Socket.IO connection...');
    this.isConnected = true;

    this.socket = io(environment.apiUrl.slice(0, -4), {
      reconnectionAttempts: 5,
      reconnectionDelay: 3000,
    });

    this.socket.on('connect', () => {
      console.log("Socket.IO Connected");
    });

    this.socket.on('disconnect', (reason) => {
      console.warn(`Socket.IO Disconnected: ${reason}`);
    });

    this.socket.on('connect_error', (error) => {
      console.error('%cSocket.IO Connection Error:', 'color: #f44336; font-weight: bold;', error);
    });
  }

  /**
   * Check if socket is connected
   */
  isSocketConnected(): boolean {
    return this.isConnected && this.socket !== null;
  }

  public connectionHook(cb: () => void) {
    if (!this.socket) return;
    this.socket.on('connect', cb);
  }

  authenticate(token: string) {
    if (!this.socket) return;
    this.socket.emit('authenticate', token);
  }

  /**
   * Subscribes to a specific topic.
   * @param topic The name of the topic to subscribe to.
   */
  subscribe(topic: ESocketMessage) {
    if (!this.socket) return;
    this.socket.emit('subscribe', {topic, token: this.getToken()});
  }


  private getToken(): string | null {
    if (!this.isBrowser) return null;
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  }

  /**
   * Unsubscribes from a specific topic.
   * @param topic The name of the topic to unsubscribe from.
   */
  unsubscribe(topic: ESocketMessage) {
    if (!this.socket) return;
    this.socket.emit('unsubscribe', topic);
  }

  /**
   * Listens for a specific event from the server.
   * @param eventName The name of the event to listen for (e.g., 'users-updated').
   * @returns An Observable that emits data when the event is received.
   */
  listen<T>(eventName: ESocketMessage): Observable<T> {
    return new Observable((subscriber) => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }
      this.socket.on(eventName, (data: T) => {
        subscriber.next(data);
      });
    });
  }

  /**
   * Disconnects the socket when the service is destroyed.
   */
  ngOnDestroy() {
    if (this.socket) {
      this.socket.disconnect();
    }
  }
}

import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ESocketMessage } from '../models/enums/socket-message.enum';

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket;

  constructor() {
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

  authenticate(token: string) {
    this.socket.emit('authenticate', token);
  }

  /**
   * Subscribes to a specific topic.
   * @param topic The name of the topic to subscribe to.
   */
  subscribe(topic: ESocketMessage) {
    this.socket.emit('subscribe', topic);
  }

  /**
   * Unsubscribes from a specific topic.
   * @param topic The name of the topic to unsubscribe from.
   */
  unsubscribe(topic: ESocketMessage) {
    this.socket.emit('unsubscribe', topic);
  }

  /**
   * Listens for a specific event from the server.
   * @param eventName The name of the event to listen for (e.g., 'users-updated').
   * @returns An Observable that emits data when the event is received.
   */
  listen<T>(eventName: ESocketMessage): Observable<T> {
    return new Observable((subscriber) => {
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

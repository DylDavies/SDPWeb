import { inject, Injectable } from '@angular/core';
import { Observable, shareReplay } from 'rxjs';
import { ESocketMessage } from '../models/enums/socket-message.enum';
import { SocketService } from './socket-service';

@Injectable({
  providedIn: 'root'
})
export class CustomObservableService {
  public socketService = inject(SocketService);

  /**
   * Creates a new observable that automatically manages WebSocket topic subscription
   * based on its own subscriber count.
   * @param topic The WebSocket topic to manage.
   * @param source$ The source observable to share.
   */
  public createManagedTopicObservable<T>(topic: ESocketMessage, source$: Observable<T>, fetchFunction: () => Observable<T>): Observable<T> {
    let subscriberCount = 0;
    
    // This new Observable wraps the logic for managing the side effect (socket subscription)
    const managedObservable = new Observable<T>(subscriber => {
      // This code runs for each new subscriber

      if (subscriberCount === 0) {
        console.log(`First subscriber; subscribing to WebSocket topic: ${topic}`);
        this.socketService.subscribe(topic);
        // Also fetch the initial data when the first subscriber appears
        fetchFunction().subscribe();
      }
      subscriberCount++;

      const sourceSubscription = source$.subscribe(subscriber);

      // This is the teardown logic that runs when a subscriber unsubscribes
      return () => {
        sourceSubscription.unsubscribe();
        subscriberCount--;

        if (subscriberCount === 0) {
          console.log(`Last subscriber unsubscribed; unsubscribing from WebSocket topic: ${topic}`);
          this.socketService.unsubscribe(topic);
        }
      };
    });

    // We use shareReplay to ensure the underlying observable is shared among all subscribers
    // and that new subscribers get the last emitted value.
    return managedObservable.pipe(
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }
}

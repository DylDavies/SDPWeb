import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ISidebarItem } from '../models/interfaces/ISidebarItem.interface';
import { HttpService } from './http-service';
import { SocketService } from './socket-service';
import { ESocketMessage } from '../models/enums/socket-message.enum';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private http = inject(HttpService);
  private socketService = inject(SocketService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // A BehaviorSubject holds the current value and acts as our cache.
  // It's initialized with an empty array.
  private sidebarItemsSource = new BehaviorSubject<ISidebarItem[]>([]);

  /**
   * Public observable that components can subscribe to.
   * They will automatically receive the cached data or updates.
   */
  sidebarItems$ = this.sidebarItemsSource.asObservable();
  private socketListenerSetup = false;

  constructor() {
    // Setup socket listener when socket is connected (only in browser)
    if (this.isBrowser) {
      this.setupSocketListener();
    }
  }

  /**
   * Sets up the socket listener for sidebar updates.
   * This is called either immediately if socket is connected, or deferred via connection hook.
   */
  private setupSocketListener() {
    if (this.socketListenerSetup) return;

    if (this.socketService.isSocketConnected()) {
      this.socketService.listen(ESocketMessage.SidebarUpdated).subscribe(() => {
        console.log('Received sidebar-updated event. Refreshing sidebar items.');
        this.fetchAndCacheSidebarItems();
      });
      this.socketListenerSetup = true;
    } else {
      // Wait for socket to connect before setting up listener
      this.socketService.connectionHook(() => {
        if (!this.socketListenerSetup) {
          this.socketService.listen(ESocketMessage.SidebarUpdated).subscribe(() => {
            console.log('Received sidebar-updated event. Refreshing sidebar items.');
            this.fetchAndCacheSidebarItems();
          });
          this.socketListenerSetup = true;
        }
      });
    }
  }

  /**
   * Triggers the API call to fetch sidebar items, but only if the cache is empty.
   * This method should be called once when the application loads.
   */
  fetchAndCacheSidebarItems(): void {
    // Only fetch if the BehaviorSubject's current value is an empty array.
    if (this.sidebarItemsSource.getValue().length === 0) {
      this.http.get<ISidebarItem[]>('sidebar').subscribe(items => {
        // When the data arrives, update the BehaviorSubject.
        // All subscribers will now receive this new data.
        this.sidebarItemsSource.next(items);
      });
    }
  }

  /**
   * Updates the sidebar on the backend. After a successful update,
   * it refreshes the cache with the new data returned from the API.
   * This ensures the UI stays in sync.
   * @param items The new array of sidebar items.
   */
  updateSidebarItems(items: ISidebarItem[]): Observable<ISidebarItem[]> {
    return this.http.put<ISidebarItem[]>('sidebar', items).pipe(
      tap(updatedItems => {
        // On success, update the cache. This invalidates the old data.
        this.sidebarItemsSource.next(updatedItems);
      })
    );
  }

  /**
   * Clears the sidebar item cache by emitting an empty array.
   * This should be called on user logout.
   */
  clearCache(): void {
    this.sidebarItemsSource.next([]);
  }
}
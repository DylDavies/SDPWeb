import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpService } from './http-service';
import { IEvent } from '../models/interfaces/IEvent.interface';

/**
 * A service for managing calendar events.
 */
@Injectable({
  providedIn: 'root'
})
export class EventService {
  private httpService = inject(HttpService);

  /**
   * Creates a new event.
   * @param {any} eventData - The data for the event to create.
   * @returns {Observable<IEvent>} The created event.
   */
  createEvent(eventData: any): Observable<IEvent> {
    return this.httpService.post<IEvent>('events', eventData);
  }

  /**
   * Retrieves all events for the current user.
   * @returns {Observable<IEvent[]>} A list of events.
   */
  getEvents(): Observable<IEvent[]> {
    return this.httpService.get<IEvent[]>('events');
  }

  /**
   * Updates an existing event.
   * @param {string} eventId - The ID of the event to update.
   * @param {any} eventData - The data to update the event with.
   * @returns {Observable<IEvent>} The updated event.
   */
  updateEvent(eventId: string, eventData: any): Observable<IEvent> {
    return this.httpService.patch<IEvent>(`events/${eventId}`, eventData);
  }

  /**
   * Deletes an event.
   * @param {string} eventId - The ID of the event to delete.
   * @returns {Observable<void>}
   */
  deleteEvent(eventId: string): Observable<void> {
    return this.httpService.delete<void>(`events/${eventId}`);
  }

  /**
   * Rates an event.
   * @param {string} eventId - The ID of the event to rate.
   * @param {number} rating - The rating to give the event.
   * @returns {Observable<IEvent>} The updated event.
   */
  rateEvent(eventId: string, rating: number): Observable<IEvent> {
    return this.httpService.patch<IEvent>(`events/${eventId}/rate`, { rating });
  }
}
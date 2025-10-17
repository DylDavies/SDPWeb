/**
 * Common trackBy functions for Angular *ngFor directives.
 *
 * Using trackBy functions improves performance by telling Angular how to identify
 * items in lists, preventing unnecessary DOM re-renders when data changes.
 *
 * Usage:
 * ```typescript
 * import { TrackByUtils } from '@core/utils/trackby.utils';
 *
 * export class MyComponent {
 *   trackById = TrackByUtils.trackById;
 *   trackByIndex = TrackByUtils.trackByIndex;
 * }
 * ```
 *
 * In template:
 * ```html
 * <div *ngFor="let item of items; trackBy: trackById">...</div>
 * ```
 */
export class TrackByUtils {
  /**
   * Track items by their 'id' property.
   * Use for items with an 'id' field.
   */
  static trackById<T extends { id: string | number }>(index: number, item: T): string | number {
    return item.id;
  }

  /**
   * Track items by their '_id' property (MongoDB style).
   * Use for items with an '_id' field.
   */
  static trackBy_id<T extends { _id: string }>(index: number, item: T): string {
    return item._id;
  }

  /**
   * Track items by array index.
   * Use for simple arrays without unique identifiers.
   * Note: Less efficient than ID-based tracking if list order changes frequently.
   */
  static trackByIndex(index: number): number {
    return index;
  }

  /**
   * Track items by a custom property name.
   * Returns a function that can be used as a trackBy function.
   *
   * @param propertyName - The property name to track by
   * @returns A trackBy function
   *
   * Usage:
   * ```typescript
   * trackByName = TrackByUtils.trackByProperty('name');
   * ```
   */
  static trackByProperty<T>(propertyName: keyof T): (index: number, item: T) => any {
    return (index: number, item: T) => item[propertyName];
  }

  /**
   * Track items by their 'value' property.
   * Use for items with a 'value' field (common for dropdowns, chips, etc.).
   */
  static trackByValue<T extends { value: string | number }>(index: number, item: T): string | number {
    return item.value;
  }

  /**
   * Track items by their 'name' property.
   * Use for items with a 'name' field.
   */
  static trackByName<T extends { name: string }>(index: number, item: T): string {
    return item.name;
  }
}

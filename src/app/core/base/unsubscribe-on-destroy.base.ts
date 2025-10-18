import { Directive, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';

/**
 * Base class that provides automatic unsubscribe functionality via takeUntil pattern.
 *
 * Usage:
 * ```typescript
 * export class MyComponent extends UnsubscribeOnDestroy implements OnInit {
 *   ngOnInit() {
 *     this.someService.getData()
 *       .pipe(takeUntil(this.destroy$))
 *       .subscribe(data => console.log(data));
 *   }
 * }
 * ```
 *
 * Note: Components extending this class MUST call super.ngOnDestroy() if they implement their own ngOnDestroy
 */
@Directive()
export abstract class UnsubscribeOnDestroy implements OnDestroy {
  /**
   * Subject that emits when component is destroyed.
   * Use with takeUntil operator to automatically unsubscribe from observables.
   */
  protected destroy$ = new Subject<void>();

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

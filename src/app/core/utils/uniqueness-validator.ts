import { DestroyRef, signal, type Signal } from '@angular/core';
import { type Observable, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, map, catchError } from 'rxjs/operators';

export interface UniquenessValidator {
  checking: Signal<boolean>;
  checked: Signal<boolean>;
  error: Signal<string | undefined>;
  trigger: (value: string) => void;
  recheck: () => Observable<boolean>;
  destroy: () => void;
}

export function createUniquenessValidator(config: {
  checkFn: (value: string) => Observable<{ available: boolean }>;
  fieldLabel: string;
}, destroyRef?: DestroyRef): UniquenessValidator {
  const valueSubject = new Subject<string>();
  const checking = signal(false);
  const checked = signal(false);
  const error = signal<string | undefined>(undefined);
  let lastValue = '';

  const sub = valueSubject.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((value) => {
      if (!value.trim()) {
        checking.set(false);
        error.set(undefined);
        return of({ available: true });
      }
      lastValue = value;
      checking.set(true);
      return config.checkFn(value).pipe(
        map(res => res),
        catchError(() => of({ available: true })),
      );
    }),
  ).subscribe((res) => {
    checking.set(false);
    checked.set(true);
    if (!res.available) {
      error.set(`Este ${config.fieldLabel} ya está en uso`);
    } else if (error() !== undefined) {
      error.set(undefined);
    }
  });

  if (destroyRef) {
    destroyRef.onDestroy(() => {
      sub.unsubscribe();
      valueSubject.complete();
    });
  }

  return {
    checking: checking.asReadonly(),
    checked: checked.asReadonly(),
    error: error.asReadonly(),
    trigger(value: string) {
      lastValue = value;
      valueSubject.next(value);
    },
    recheck() {
      if (!lastValue.trim()) return of(true);
      checking.set(true);
      return config.checkFn(lastValue).pipe(
        map(res => {
          checking.set(false);
          if (!res.available) {
            error.set(`Este ${config.fieldLabel} ya está en uso`);
          } else {
            error.set(undefined);
          }
          return res.available;
        }),
        catchError(() => {
          checking.set(false);
          return of(true);
        }),
      );
    },
    destroy() {
      sub.unsubscribe();
      valueSubject.complete();
    },
  };
}

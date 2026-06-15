import { Component, input, output } from '@angular/core';
import { SkeletonComponent } from '../skeleton/skeleton.component';

@Component({
  selector: 'app-data-state',
  imports: [SkeletonComponent],
  template: `
    @if (loading()) {
      @if (skeleton()) {
        <app-skeleton />
      } @else {
        <p class="mt-4 text-gray-500 dark:text-gray-400" data-testid="data-state-loading">Cargando…</p>
      }
    } @else if (error(); as err) {
      <div class="mt-4 flex flex-col items-center gap-3">
        <p class="text-red-600">{{ err || errorMessage() }}</p>
        <button
          type="button"
          (click)="retry.emit()"
          class="rounded-lg bg-blue-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          Reintentar
        </button>
      </div>
    } @else if (empty()) {
      <p class="mt-4 text-gray-500 dark:text-gray-400">{{ emptyMessage() }}</p>
    } @else {
      <div data-testid="data-state-content">
        <ng-content />
      </div>
    }
  `,
})
export class DataStateComponent {
  readonly loading = input.required<boolean>();
  readonly empty = input.required<boolean>();
  readonly error = input<string | undefined>();
  readonly skeleton = input(false);
  readonly emptyMessage = input<string>('No hay datos');
  readonly errorMessage = input<string>('Error al cargar datos');
  readonly retry = output<void>();
}

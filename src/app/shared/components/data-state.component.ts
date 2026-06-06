import { Component, input } from '@angular/core';

@Component({
  selector: 'app-data-state',
  template: `
    @if (loading()) {
      <p class="mt-4 text-gray-500 dark:text-gray-400" data-testid="data-state-loading">Cargando…</p>
    } @else if (error(); as err) {
      <p class="mt-4 text-red-600">{{ err || errorMessage() }}</p>
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
  readonly emptyMessage = input<string>('No hay datos');
  readonly errorMessage = input<string>('Error al cargar datos');
}

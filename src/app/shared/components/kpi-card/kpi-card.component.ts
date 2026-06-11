import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-kpi-card',
  imports: [RouterLink],
  template: `
    <a [routerLink]="route()" data-testid="kpi-link" class="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md dark:border-gray-700 dark:bg-slate-900">
      <div data-testid="kpi-icon" class="flex h-12 w-12 items-center justify-center rounded-lg bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-300">
        <svg class="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      </div>
      <div>
        <p class="text-sm text-gray-500 dark:text-gray-400">{{ label() }}</p>
        @if (loading()) {
          <div class="mt-1 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-700" data-testid="kpi-skeleton"></div>
        } @else {
          <p class="text-2xl font-bold text-gray-900 dark:text-white" data-testid="kpi-value">{{ value() ?? '—' }}</p>
        }
      </div>
    </a>
  `,
})
export class KpiCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number | null>();
  readonly route = input.required<string>();
  readonly icon = input('chart-bar');
  readonly loading = input(false);
}

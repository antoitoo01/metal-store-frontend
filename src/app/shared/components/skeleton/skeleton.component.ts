import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  template: `
    @if (type() === 'table') {
      @for (r of rowArray(); track r) {
        <div data-testid="skeleton-row" class="flex animate-pulse gap-4 px-4 py-3">
          @for (c of colArray(); track c) {
            <div data-testid="skeleton-cell" class="h-4 flex-1 rounded bg-gray-200 dark:bg-gray-700"></div>
          }
        </div>
      }
    } @else {
      <div data-testid="skeleton-card" class="animate-pulse rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-slate-900">
        <div class="flex items-center gap-4">
          <div class="h-12 w-12 rounded-lg bg-gray-200 dark:bg-gray-700"></div>
          <div class="flex-1 space-y-2">
            <div class="h-4 w-1/3 rounded bg-gray-200 dark:bg-gray-700"></div>
            <div class="h-6 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SkeletonComponent {
  readonly type = input<'table' | 'card'>('table');
  readonly rows = input(5);
  readonly columns = input(4);

  readonly rowArray = computed(() => Array.from({ length: this.rows() }, (_, i) => i));
  readonly colArray = computed(() => Array.from({ length: this.columns() }, (_, i) => i));
}

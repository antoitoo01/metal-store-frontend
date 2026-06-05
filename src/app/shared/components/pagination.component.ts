import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-pagination',
  standalone: true,
  template: `
    @if (totalPages() > 1) {
      <div class="flex items-center gap-1 text-sm">
        <button
          [disabled]="currentPage() === 0"
          (click)="goTo(0)"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          «
        </button>
        <button
          [disabled]="currentPage() === 0"
          (click)="goTo(currentPage() - 1)"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          ‹
        </button>
        <span class="px-2 text-gray-600">
          Página {{ currentPage() + 1 }} de {{ totalPages() }}
        </span>
        <button
          [disabled]="currentPage() >= totalPages() - 1"
          (click)="goTo(currentPage() + 1)"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          ›
        </button>
        <button
          [disabled]="currentPage() >= totalPages() - 1"
          (click)="goTo(totalPages() - 1)"
          class="rounded px-2 py-1 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed">
          »
        </button>
      </div>
    }
  `,
})
export class PaginationComponent {
  readonly currentPage = input<number>(0);
  readonly totalPages = input<number>(0);
  readonly pageChange = output<number>();

  protected goTo(page: number): void {
    if (page >= 0 && page < this.totalPages()) {
      this.pageChange.emit(page);
    }
  }
}

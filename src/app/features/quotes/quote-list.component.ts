import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { QuoteService } from './quote.service';
import { QuoteResponse, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-quote-list',
  imports: [RouterLink, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Presupuestos</h1>
        <a routerLink="/quotes/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nuevo presupuesto</a>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <app-search-input placeholder="Buscar presupuesto…" (searchChange)="search($event)" />
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Estado:</label>
          <select
            (change)="setStatusFilter($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="ISSUED">Emitido</option>
            <option value="ACCEPTED">Aceptado</option>
            <option value="REJECTED">Rechazado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Desde:</label>
          <input
            type="date"
            [value]="dateFrom()"
            (change)="setDateFrom($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Hasta:</label>
          <input
            type="date"
            [value]="dateTo()"
            (change)="setDateTo($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar presupuestos' : undefined" [empty]="filteredQuotes().length === 0" [skeleton]="true" (retry)="query.refetch()">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (q of filteredQuotes(); track q.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ q.quoteNumber }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ q.customerName ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ q.issueDate }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ q.validUntil ?? '—' }}</td>
              <td class="font-medium text-gray-900 dark:text-white">{{ q.total.toFixed(2) }} €</td>
              <td>
                <app-status-badge [status]="q.status" />
              </td>
              <td>
                <a [routerLink]="[q.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver</a>
              </td>
            </tr>
          }
        </app-table>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
      </app-data-state>
    </div>
  `,
})
export class QuoteListComponent {
  private readonly quoteService = inject(QuoteService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly statusFilter = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly columnDefs: ColumnDef[] = [
    { key: 'quoteNumber', label: 'Número', sortable: true },
    { key: 'customerName', label: 'Cliente', sortable: true },
    { key: 'issueDate', label: 'Fecha', sortable: true },
    { key: 'validUntil', label: 'Válido hasta', sortable: true },
    { key: 'total', label: 'Total', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: '', label: '' },
  ];

  protected readonly filteredQuotes = computed(() => {
    const data = this.query.data()?.content;
    if (!data) return [];
    let result = data;
    const from = this.dateFrom();
    if (from) result = result.filter(q => q.issueDate >= from);
    const to = this.dateTo();
    if (to) result = result.filter(q => q.issueDate <= to);
    return result;
  });

  readonly query = injectQuery<Page<QuoteResponse>>(() => ({
    queryKey: ['quotes', { page: this.page(), q: this.q(), status: this.statusFilter() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }],
    queryFn: () => firstValueFrom(this.quoteService.list(this.page(), this.size, this.q() || undefined, this.statusFilter() || undefined, undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
  }));

  onSortChange(sort: SortChange): void {
    this.sortBy.set(sort.column);
    this.sortDir.set(sort.direction);
    this.page.set(0);
  }

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.page.set(0);
  }

  setDateFrom(value: string): void {
    this.dateFrom.set(value);
    this.page.set(0);
  }

  setDateTo(value: string): void {
    this.dateTo.set(value);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

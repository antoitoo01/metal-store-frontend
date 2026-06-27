import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { InboundService } from './inbound.service';
import { InboundDNResponse, Page } from '../../core/models/api.types';
import { exportCsv } from '../../core/services/csv-export';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-inbound-list',
  imports: [RouterLink, ButtonComponent, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Albaranes de entrada</h1>
        <a routerLink="/inbound/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nuevo albarán</a>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <app-search-input placeholder="Buscar albarán…" (searchChange)="search($event)" />
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Estado:</label>
          <select
            (change)="setStatusFilter($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="CONFIRMED">Confirmado</option>
            <option value="CANCELLED">Cancelado</option>
          </select>
        </div>
        <app-button variant="secondary" size="sm" (clicked)="exportToCsv()" [disabled]="filteredItems().length === 0">Exportar CSV</app-button>
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar albaranes de entrada' : undefined" [empty]="filteredItems().length === 0" [skeleton]="true" (retry)="query.refetch()">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (dn of filteredItems(); track dn.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ dn.number }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ dn.supplierName ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ dn.issueDate }}</td>
              <td>
                <app-status-badge [status]="dn.status" />
              </td>
              <td class="font-medium text-gray-900 dark:text-white">{{ dn.totalAmount.toFixed(2) }} €</td>
              <td>
                <a [routerLink]="[dn.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver</a>
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
export class InboundListComponent {
  private readonly inboundService = inject(InboundService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly statusFilter = signal('');

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly columnDefs: ColumnDef[] = [
    { key: 'number', label: 'Número', sortable: true },
    { key: 'supplierName', label: 'Proveedor', sortable: true },
    { key: 'issueDate', label: 'Fecha', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'totalAmount', label: 'Total', sortable: true },
    { key: '', label: '' },
  ];

  protected readonly filteredItems = computed(() => {
    return this.query.data()?.content ?? [];
  });

  readonly query = injectQuery<Page<InboundDNResponse>>(() => ({
    queryKey: ['inbound', { page: this.page(), q: this.q(), status: this.statusFilter() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }],
    queryFn: () => firstValueFrom(this.inboundService.list(this.page(), this.size, this.q() || undefined, this.statusFilter() || undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
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

  goTo(p: number) {
    this.page.set(p);
  }

  protected exportToCsv(): void {
    const items = this.filteredItems();
    exportCsv('albaranes-entrada', ['Número', 'Proveedor', 'Fecha', 'Estado', 'Total'], items.map((dn) => [
      dn.number, dn.supplierName, dn.issueDate, dn.status, dn.totalAmount,
    ]));
  }
}

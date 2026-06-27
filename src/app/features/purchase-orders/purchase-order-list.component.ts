import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, keepPreviousData } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { PurchaseOrderService } from './purchase-order.service';
import { PurchaseOrderResponse, Page } from '../../core/models/api.types';
import { exportCsv } from '../../core/services/csv-export';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-purchase-order-list',
  imports: [RouterLink, ButtonComponent, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Órdenes de compra</h1>
        <a routerLink="/purchase-orders/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nueva OC</a>
      </div>

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <app-search-input placeholder="Buscar orden de compra…" (searchChange)="search($event)" />
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Estado:</label>
          <select
            (change)="setStatusFilter($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="DRAFT">Borrador</option>
            <option value="ISSUED">Emitida</option>
            <option value="RECEIVED">Recibida</option>
            <option value="CANCELLED">Cancelada</option>
          </select>
        </div>
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Proveedor:</label>
          <input
            type="text"
            placeholder="Filtrar proveedor…"
            (input)="setSupplierFilter($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          />
        </div>
        <app-button variant="secondary" size="sm" (clicked)="exportToCsv()" [disabled]="filteredOrders().length === 0">Exportar CSV</app-button>
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar órdenes de compra' : undefined" [empty]="filteredOrders().length === 0" [skeleton]="true" (retry)="query.refetch()">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (po of filteredOrders(); track po.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ po.poNumber }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ po.supplierName ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ po.issueDate }}</td>
              <td>
                <app-status-badge [status]="po.status" />
              </td>
              <td class="font-medium text-gray-900 dark:text-white">{{ po.total.toFixed(2) }} €</td>
              <td>
                <a [routerLink]="[po.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver</a>
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
export class PurchaseOrderListComponent {
  private readonly poService = inject(PurchaseOrderService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly statusFilter = signal('');
  readonly supplierFilter = signal('');

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly columnDefs: ColumnDef[] = [
    { key: 'poNumber', label: 'Número OC', sortable: true },
    { key: 'supplierName', label: 'Proveedor', sortable: true },
    { key: 'issueDate', label: 'Fecha', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: 'total', label: 'Total', sortable: true },
    { key: '', label: '' },
  ];

  protected readonly filteredOrders = computed(() => {
    const data = this.query.data()?.content;
    if (!data) return [];
    const supplier = this.supplierFilter().toLowerCase();
    if (!supplier) return data;
    return data.filter(po => (po.supplierName ?? '').toLowerCase().includes(supplier));
  });

  readonly query = injectQuery<Page<PurchaseOrderResponse>>(() => ({
    queryKey: ['purchase-orders', { page: this.page(), q: this.q(), status: this.statusFilter() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }],
    queryFn: () => firstValueFrom(this.poService.list(this.page(), this.size, this.q() || undefined, this.statusFilter() || undefined, undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
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

  setSupplierFilter(value: string): void {
    this.supplierFilter.set(value);
  }

  goTo(p: number) {
    this.page.set(p);
  }

  protected exportToCsv(): void {
    const orders = this.filteredOrders();
    exportCsv('ordenes-de-compra', ['Número OC', 'Proveedor', 'Fecha', 'Estado', 'Total'], orders.map((po) => [
      po.poNumber, po.supplierName, po.issueDate, po.status, po.total.toFixed(2),
    ]));
  }
}

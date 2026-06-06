import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Facturas</h2>
        <a routerLink="/billing/invoices/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nueva factura</a>
      </div>

      <div class="mt-4">
        <app-search-input placeholder="Buscar factura…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar facturas' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Número', 'Cliente', 'Fecha', 'Vencimiento', 'Total', 'Estado', '']">
          @for (inv of filtered(); track inv.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ inv.invoiceNumber }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ inv.customerName ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ inv.issueDate }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ inv.dueDate ?? '—' }}</td>
              <td class="font-medium text-gray-900 dark:text-white">{{ inv.total.toFixed(2) }} €</td>
              <td>
                <app-status-badge [status]="inv.status" />
              </td>
              <td>
                <a [routerLink]="[inv.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Ver</a>
              </td>
            </tr>
          }
        </app-table>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
        @if (q() && query.data()) {
          <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">{{ filtered().length }} de {{ query.data()!.totalElements }} facturas</p>
        }
      </app-data-state>
    </div>
  `,
})
export class InvoiceListComponent {
  private readonly billing = inject(BillingService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly query = injectQuery<Page<InvoiceResponse>>(() => ({
    queryKey: ['invoices', { page: this.page() }],
    queryFn: () => firstValueFrom(this.billing.invoices(this.page(), this.size)),
  }));

  readonly filtered = computed(() => {
    const data = this.query.data()?.content ?? [];
    const term = this.q().toLowerCase();
    if (!term) return data;
    return data.filter(
      (inv) =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        (inv.customerName ?? '').toLowerCase().includes(term),
    );
  });

  search(term: string) {
    this.q.set(term);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { QuoteService } from './quote.service';
import { QuoteResponse, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';

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

      <div class="mt-4">
        <app-search-input placeholder="Buscar presupuesto…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar presupuestos' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Número', 'Cliente', 'Fecha', 'Válido hasta', 'Total', 'Estado', '']">
          @for (q of query.data()?.content; track q.id) {
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

  readonly query = injectQuery<Page<QuoteResponse>>(() => ({
    queryKey: ['quotes', { page: this.page(), q: this.q() }],
    queryFn: () => firstValueFrom(this.quoteService.list(this.page(), this.size, this.q() || undefined)),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

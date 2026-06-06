import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';
import { CatalogItem, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';

@Component({
  selector: 'app-catalog-items',
  imports: [PaginationComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div>
      <div class="flex items-center gap-4">
        <app-search-input placeholder="Buscar artículo…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar artículos' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Designación', 'SKU', 'Tipo', 'Material', 'Peso (kg/m)', 'Precio est. (€/kg)']">
          @for (item of query.data()?.content; track item.id) {
            <tr>
          <td class="font-medium text-gray-900 dark:text-white">{{ item.designation }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.sku ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.itemType }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.material ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.weightKgM ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.estimatedPriceKg }}</td>
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
export class CatalogItemsComponent {
  private readonly catalog = inject(CatalogService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly query = injectQuery<Page<CatalogItem>>(() => ({
    queryKey: ['catalog-items', { page: this.page(), q: this.q() }],
    queryFn: () => firstValueFrom(this.catalog.items(this.page(), this.size, this.q() || undefined)),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

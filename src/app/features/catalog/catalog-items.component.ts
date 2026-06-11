import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { ColumnDef } from '../../shared/components/table/column-def.type';
import { CatalogItem, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-catalog-items',
  imports: [RouterLink, PaginationComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div>
      <div class="flex items-center gap-4">
        <app-search-input placeholder="Buscar artículo…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar artículos' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="columnDefs">
          @for (item of query.data()?.content; track item.id) {
            <tr>
          <td class="font-medium text-gray-900 dark:text-white">{{ item.designation }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.sku ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.itemType }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.material ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.weightKgM ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ item.estimatedPriceKg }}</td>
          <td><a [routerLink]="['/catalog/items', item.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">Ver</a></td>
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
  readonly columnDefs: ColumnDef[] = [
    { key: 'designation', label: 'Designación' },
    { key: 'sku', label: 'SKU' },
    { key: 'itemType', label: 'Tipo' },
    { key: 'material', label: 'Material' },
    { key: 'weightKgM', label: 'Peso (kg/m)' },
    { key: 'estimatedPriceKg', label: 'Precio est. (€/kg)' },
    { key: 'actions', label: '' },
  ];

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

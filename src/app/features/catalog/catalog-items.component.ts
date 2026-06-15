import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';
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

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar artículos' : undefined" [empty]="query.data()?.content?.length === 0" [skeleton]="true" (retry)="query.refetch()">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
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
    { key: 'designation', label: 'Designación', sortable: true },
    { key: 'sku', label: 'SKU', sortable: true },
    { key: 'itemType', label: 'Tipo', sortable: true },
    { key: 'material', label: 'Material', sortable: true },
    { key: 'weightKgM', label: 'Peso (kg/m)', sortable: true },
    { key: 'estimatedPriceKg', label: 'Precio est. (€/kg)', sortable: true },
    { key: 'actions', label: '' },
  ];

  private readonly catalog = inject(CatalogService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly query = injectQuery<Page<CatalogItem>>(() => ({
    queryKey: ['catalog-items', { page: this.page(), q: this.q(), sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }],
    queryFn: () => firstValueFrom(this.catalog.items(this.page(), this.size, this.q() || undefined, undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  onSortChange(sort: SortChange): void {
    this.sortBy.set(sort.column);
    this.sortDir.set(sort.direction);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

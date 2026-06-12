import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { CatalogService } from './catalog.service';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';
import { CatalogProfile, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';

@Component({
  selector: 'app-catalog-profiles',
  imports: [RouterLink, PaginationComponent, DataStateComponent, TableComponent, SearchInputComponent],
  template: `
    <div>
      <div class="flex items-center gap-4">
        <app-search-input placeholder="Buscar perfil…" (searchChange)="search($event)" />
        <select (change)="standardFilter.set($any($event.target).value)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white">
          <option value="">Todas las normas</option>
          <option value="EUR">EUR</option>
          <option value="AISC">AISC</option>
        </select>
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar perfiles' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (p of query.data()?.content; track p.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ p.designation }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ p.family.name }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ p.family.standard }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ p.weightKgM ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ p.areaCm2 ?? '—' }}</td>
              <td><a [routerLink]="['/catalog/profiles', p.id]" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400">Ver</a></td>
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
export class CatalogProfilesComponent {
  readonly columnDefs: ColumnDef[] = [
    { key: 'designation', label: 'Designación', sortable: true },
    { key: 'family', label: 'Familia', sortable: true },
    { key: 'standard', label: 'Norma', sortable: true },
    { key: 'weightKgM', label: 'Peso (kg/m)', sortable: true },
    { key: 'areaCm2', label: 'Área (cm²)', sortable: true },
    { key: 'actions', label: '' },
  ];

  private readonly catalog = inject(CatalogService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly standardFilter = signal('');

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly query = injectQuery<Page<CatalogProfile>>(() => ({
    queryKey: ['catalog-profiles', { page: this.page(), q: this.q(), standard: this.standardFilter(), sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }],
    queryFn: () => firstValueFrom(this.catalog.profiles(this.page(), this.size, this.q() || undefined, this.standardFilter() || undefined, undefined, undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
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

import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';
import { CatalogFamily } from '../../core/models/api.types';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';

@Component({
  selector: 'app-catalog-families',
  imports: [DataStateComponent, TableComponent],
  template: `
    <div>
      <select (change)="standard.set($any($event.target).value)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white">
        <option value="">EUR</option>
        <option value="AISC">AISC</option>
      </select>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar familias' : undefined" [empty]="sorted().length === 0">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (f of sorted(); track f.id) {
            <tr>
              <td class="font-semibold text-gray-900 dark:text-white">{{ f.code }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ f.name }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ f.standard }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ f.shapeType }}</td>
            </tr>
          }
        </app-table>
      </app-data-state>
    </div>
  `,
})
export class CatalogFamiliesComponent {
  readonly columnDefs: ColumnDef[] = [
    { key: 'code', label: 'Código', sortable: true },
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'standard', label: 'Norma', sortable: true },
    { key: 'shapeType', label: 'Tipo', sortable: true },
  ];

  private readonly catalog = inject(CatalogService);

  readonly standard = signal('EUR');

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly query = injectQuery(() => ({
    queryKey: ['catalog-families', this.standard()],
    queryFn: () => firstValueFrom(this.catalog.families(this.standard() || undefined)),
  }));

  readonly sorted = computed(() => {
    const data = this.query.data();
    if (!data) return [];
    const key = this.sortBy();
    if (!key) return data;
    const dir = this.sortDir() === 'asc' ? 1 : -1;
    return [...data].sort((a, b) => {
      const av = String((a as any)[key] ?? '');
      const bv = String((b as any)[key] ?? '');
      return av.localeCompare(bv) * dir;
    });
  });

  onSortChange(sort: SortChange): void {
    this.sortBy.set(sort.column);
    this.sortDir.set(sort.direction);
  }
}

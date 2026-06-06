import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';

@Component({
  selector: 'app-catalog-families',
  imports: [DataStateComponent, TableComponent],
  template: `
    <div>
      <select (change)="standard.set($any($event.target).value)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white">
        <option value="">EUR</option>
        <option value="AISC">AISC</option>
      </select>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar familias' : undefined" [empty]="query.data()?.length === 0">
        <app-table [columns]="['Código', 'Nombre', 'Norma', 'Tipo']">
          @for (f of query.data(); track f.id) {
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
  private readonly catalog = inject(CatalogService);

  readonly standard = signal('EUR');

  readonly query = injectQuery(() => ({
    queryKey: ['catalog-families', this.standard()],
    queryFn: () => firstValueFrom(this.catalog.families(this.standard() || undefined)),
  }));
}

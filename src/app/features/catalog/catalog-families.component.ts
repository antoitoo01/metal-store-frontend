import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';

@Component({
  selector: 'app-catalog-families',
  template: `
    <div>
      <select (change)="standard.set($any($event.target).value)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
        <option value="">EUR</option>
        <option value="AISC">AISC</option>
      </select>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar familias</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Código</th>
              <th class="py-2 pr-4 font-medium">Nombre</th>
              <th class="py-2 pr-4 font-medium">Norma</th>
              <th class="py-2 pr-4 font-medium">Tipo</th>
            </tr>
          </thead>
          <tbody>
            @for (f of query.data(); track f.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-semibold text-gray-900">{{ f.code }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ f.name }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ f.standard }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ f.shapeType }}</td>
              </tr>
            }
          </tbody>
        </table>
      }
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

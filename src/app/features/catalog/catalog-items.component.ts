import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';
import { CatalogItem, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-catalog-items',
  imports: [],
  template: `
    <div>
      <div class="flex items-center gap-4">
        <input #searchInput (input)="search(searchInput.value)" placeholder="Buscar artículo…"
          class="block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
      </div>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar artículos</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Designación</th>
              <th class="py-2 pr-4 font-medium">SKU</th>
              <th class="py-2 pr-4 font-medium">Tipo</th>
              <th class="py-2 pr-4 font-medium">Material</th>
              <th class="py-2 pr-4 font-medium">Peso (kg/m)</th>
              <th class="py-2 pr-4 font-medium">Precio est. (€/kg)</th>
            </tr>
          </thead>
          <tbody>
            @for (item of query.data()?.content; track item.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-medium text-gray-900">{{ item.designation }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.sku ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.itemType }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.material ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.weightKgM ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.estimatedPriceKg }}</td>
              </tr>
            }
          </tbody>
        </table>

        @if (query.data() && !query.data()!.empty) {
          <div class="mt-4 flex items-center gap-2 text-sm">
            <button (click)="goTo(query.data()!.number - 1)" [disabled]="query.data()!.first"
              class="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Anterior</button>
            <span class="text-gray-600">Página {{ (query.data()?.number ?? 0) + 1 }} de {{ query.data()?.totalPages ?? 0 }}</span>
            <button (click)="goTo(query.data()!.number + 1)" [disabled]="query.data()!.last"
              class="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Siguiente</button>
          </div>
        }
      }
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

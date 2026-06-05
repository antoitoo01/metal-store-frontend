import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { CatalogService } from './catalog.service';
import { CatalogProfile, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-catalog-profiles',
  imports: [],
  template: `
    <div>
      <div class="flex items-center gap-4">
        <input #searchInput (input)="search(searchInput.value)" placeholder="Buscar perfil…"
          class="block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <select (change)="standardFilter.set($any($event.target).value)" class="rounded-lg border border-gray-300 px-3 py-2 text-sm">
          <option value="">Todas las normas</option>
          <option value="EUR">EUR</option>
          <option value="AISC">AISC</option>
        </select>
      </div>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar perfiles</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Designación</th>
              <th class="py-2 pr-4 font-medium">Familia</th>
              <th class="py-2 pr-4 font-medium">Norma</th>
              <th class="py-2 pr-4 font-medium">Peso (kg/m)</th>
              <th class="py-2 pr-4 font-medium">Área (cm²)</th>
            </tr>
          </thead>
          <tbody>
            @for (p of query.data()?.content; track p.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-medium text-gray-900">{{ p.designation }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.family.name }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.family.standard }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.weightKgM ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.areaCm2 ?? '—' }}</td>
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
export class CatalogProfilesComponent {
  private readonly catalog = inject(CatalogService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly standardFilter = signal('');

  readonly query = injectQuery<Page<CatalogProfile>>(() => ({
    queryKey: ['catalog-profiles', { page: this.page(), q: this.q(), standard: this.standardFilter() }],
    queryFn: () => firstValueFrom(this.catalog.profiles(this.page(), this.size, this.q() || undefined, this.standardFilter() || undefined)),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }
}

import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { InventoryService } from './inventory.service';
import { InventoryItemResponse, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-inventory-list',
  imports: [RouterLink, DatePipe],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Inventario</h1>
        <a routerLink="/inventory/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nuevo</a>
      </div>

      <input #searchInput (input)="search(searchInput.value)" placeholder="Buscar…"
        class="mt-4 block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm" />

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar inventario</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Cantidad</th>
              <th class="py-2 pr-4 font-medium">Ubicación</th>
              <th class="py-2 pr-4 font-medium">Proveedor</th>
              <th class="py-2 pr-4 font-medium">Coste (€)</th>
              <th class="py-2 pr-4 font-medium">Recibido</th>
              <th class="py-2 pr-4 font-medium">Notas</th>
              <th class="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            @for (item of query.data()?.content; track item.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-medium text-gray-900">{{ item.quantity }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.location ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.supplier ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.costPriceEur ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ item.receivedAt | date:'short' }}</td>
                <td class="py-2 pr-4 text-gray-600 max-w-xs truncate">{{ item.notes ?? '—' }}</td>
                <td class="py-2">
                  <div class="flex gap-2">
                    <a [routerLink]="[item.id, 'edit']" class="text-sm text-blue-600 hover:text-blue-800">Editar</a>
                    <button (click)="deleteItem(item.id)" [disabled]="deleteMutation.isPending()"
                      class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">Eliminar</button>
                  </div>
                </td>
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
export class InventoryListComponent {
  private readonly inventory = inject(InventoryService);
  private readonly queryClient = inject(QueryClient);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly query = injectQuery<Page<InventoryItemResponse>>(() => ({
    queryKey: ['inventory', { page: this.page(), q: this.q() }],
    queryFn: () => firstValueFrom(this.inventory.list(this.page(), this.size, this.q() || undefined)),
  }));

  readonly deleteMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.inventory.remove(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }

  deleteItem(id: string) {
    this.deleteMutation.mutate(id);
  }
}

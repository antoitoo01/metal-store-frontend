import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { FormsModule } from '@angular/forms';
import { CatalogService } from './catalog.service';
import { TypeResponse, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-catalog-item-types',
  imports: [FormsModule],
  template: `
    <div>
      <div class="flex items-center gap-2">
        <input [(ngModel)]="newName" placeholder="Nuevo tipo…"
          class="block w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        <button (click)="createType()" [disabled]="!newName() || createMutation.isPending()"
          class="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {{ createMutation.isPending() ? '…' : 'Crear' }}
        </button>
      </div>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Nombre</th>
              <th class="py-2 pr-4 font-medium">Acciones</th>
            </tr>
          </thead>
          <tbody>
            @for (t of query.data()?.content; track t.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 text-gray-900">{{ t.name }}</td>
                <td class="py-2">
                  <button (click)="deleteType(t.id)" [disabled]="deleteMutation.isPending()"
                    class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class CatalogItemTypesComponent {
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);

  readonly newName = signal('');

  readonly query = injectQuery<Page<TypeResponse>>(() => ({
    queryKey: ['catalog-item-types'],
    queryFn: () => firstValueFrom(this.catalog.itemTypes()),
  }));

  readonly createMutation = injectMutation<TypeResponse, Error, string>(() => ({
    mutationFn: (name) => firstValueFrom(this.catalog.createItemType({ name })),
    onSuccess: () => { this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }); this.newName.set(''); },
  }));

  readonly deleteMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.catalog.deleteItemType(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }),
  }));

  createType() {
    if (!this.newName().trim()) return;
    this.createMutation.mutate(this.newName().trim());
  }

  deleteType(id: string) {
    this.deleteMutation.mutate(id);
  }
}

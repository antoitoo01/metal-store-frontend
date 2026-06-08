import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { InventoryService } from './inventory.service';
import { InventoryItemResponse, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-inventory-list',
  imports: [RouterLink, DatePipe, ButtonComponent, PaginationComponent, DataStateComponent, TableComponent, SearchInputComponent, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Inventario</h1>
        <a routerLink="/inventory/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nuevo</a>
      </div>

      <app-search-input placeholder="Buscar…" (searchChange)="search($event)" />

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar inventario' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Cantidad', 'Ubicación', 'Proveedor', 'Coste (€)', 'Recibido', 'Notas', '']">
          @for (item of query.data()?.content; track item.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ item.quantity }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ item.location ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ item.supplier ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ item.costPriceEur ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ item.receivedAt | date:'short' }}</td>
              <td class="max-w-xs truncate text-gray-600 dark:text-gray-400">{{ item.notes ?? '—' }}</td>
              <td>
                <div class="flex gap-2">
                  <a [routerLink]="[item.id, 'edit']" class="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">Editar</a>
                  <app-button variant="ghost" size="sm" (clicked)="deleteItem(item.id)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
                </div>
              </td>
            </tr>
          }
        </app-table>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showDeleteDialog()"
        title="Eliminar item"
        message="¿Estás seguro de que querés eliminar este item del inventario?"
        variant="danger"
        (confirmed)="executeDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class InventoryListComponent {
  private readonly inventory = inject(InventoryService);
  private readonly queryClient = inject(QueryClient);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly queryKey = computed(() => ['inventory', { page: this.page(), size: this.size, q: this.q() }] as unknown[]);

  readonly query = injectQuery<Page<InventoryItemResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => firstValueFrom(this.inventory.list(this.page(), this.size, this.q() || undefined)),
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<InventoryItemResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.inventory.remove(id)),
    onMutate: (id) => optimisticRemoveFromPage<InventoryItemResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  }));

  readonly showDeleteDialog = signal(false);
  private deleteTarget = '';

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }

  deleteItem(id: string) {
    this.deleteTarget = id;
    this.showDeleteDialog.set(true);
  }

  executeDelete() {
    this.deleteMutation.mutate(this.deleteTarget);
    this.showDeleteDialog.set(false);
  }
}

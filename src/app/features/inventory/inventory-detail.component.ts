import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe, SlicePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required } from '@angular/forms/signals';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { InventoryService } from './inventory.service';
import { InventoryItemResponse, InventoryMovementResponse, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { CardComponent } from '../../shared/components/card/card.component';

interface StockForm {
  quantity: number;
  notes: string;
}

@Component({
  selector: 'app-inventory-detail',
  imports: [DatePipe, SlicePipe, FormField, RouterLink, StatusBadgeComponent, BackLinkComponent, DataStateComponent, PaginationComponent, ButtonComponent, InputComponent, CardComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/inventory" label="Volver a inventario" />

      <app-data-state [loading]="itemQuery.isPending()" [error]="itemQuery.isError() ? 'Error al cargar el item' : undefined" [empty]="false">
        @let item = itemQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ item.profileId ?? item.itemId ?? 'Item #' + item.id.slice(0, 8) }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {{ item.supplier ? 'Proveedor: ' + item.supplier : '' }}
              {{ item.location ? '· Ubicación: ' + item.location : '' }}
            </p>
          </div>
          <a [routerLink]="['/inventory', item.id, 'edit']" class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Editar</a>
        </div>

        <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <app-card>
            <div body class="text-center">
              <p class="text-sm text-gray-500 dark:text-gray-400">Cantidad total</p>
              <p class="mt-1 text-4xl font-bold text-gray-900 dark:text-white">{{ item.quantity }}</p>
            </div>
          </app-card>
          <app-card>
            <div body class="text-center">
              <p class="text-sm text-gray-500 dark:text-gray-400">Coste total estimado</p>
              <p class="mt-1 text-4xl font-bold text-gray-900 dark:text-white">{{ totalEstimatedCost() }} €</p>
            </div>
          </app-card>
        </div>

        <div class="mt-6 flex gap-3">
          <app-button (clicked)="showAddForm.set(true)" [disabled]="showAddForm()">
            + Añadir stock
          </app-button>
          <app-button variant="danger" (clicked)="showRemoveForm.set(true)" [disabled]="showRemoveForm()">
            - Retirar stock
          </app-button>
        </div>

        @if (showAddForm()) {
          <app-card>
            <div header>Añadir stock</div>
            <div body class="space-y-4">
              <app-input [formField]="addForm.quantity" label="Cantidad *" type="number" [error]="addQuantityError()" />
              <app-input [formField]="addForm.notes" label="Notas" variant="textarea" />
              <div class="flex gap-2">
                <app-button (clicked)="executeAddStock(item.id)" [disabled]="addModel().quantity <= 0 || addMutation.isPending()" [loading]="addMutation.isPending()">
                  Guardar
                </app-button>
                <app-button variant="ghost" (clicked)="cancelAddStock()">Cancelar</app-button>
              </div>
            </div>
          </app-card>
        }

        @if (showRemoveForm()) {
          <app-card>
            <div header>Retirar stock</div>
            <div body class="space-y-4">
              <app-input [formField]="removeForm.quantity" label="Cantidad *" type="number" [error]="removeQuantityError()" />
              <app-input [formField]="removeForm.notes" label="Notas" variant="textarea" />
              <div class="flex gap-2">
                <app-button variant="danger" (clicked)="executeRemoveStock(item.id)" [disabled]="removeModel().quantity <= 0 || removeMutation.isPending()" [loading]="removeMutation.isPending()">
                  Retirar
                </app-button>
                <app-button variant="ghost" (clicked)="cancelRemoveStock()">Cancelar</app-button>
              </div>
            </div>
          </app-card>
        }

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Historial de movimientos</h2>

        <app-data-state [loading]="movementsQuery.isPending()" [error]="movementsQuery.isError() ? 'Error al cargar movimientos' : undefined" [empty]="(movementsQuery.data()?.content?.length ?? 0) === 0" emptyMessage="No hay movimientos registrados.">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-4 py-2 font-medium">Fecha</th>
                <th class="px-4 py-2 font-medium">Tipo</th>
                <th class="px-4 py-2 font-medium">Cantidad</th>
                <th class="px-4 py-2 font-medium">Antes → Después</th>
                <th class="px-4 py-2 font-medium">Referencia</th>
                <th class="px-4 py-2 font-medium">Notas</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (m of movementsQuery.data()?.content; track m.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ m.performedAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="px-4 py-2">
                    <app-status-badge [status]="m.movementType" [label]="movementTypeLabel(m.movementType)" />
                  </td>
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ sign(m) }}{{ m.quantity }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ m.previousQuantity }} → {{ m.newQuantity }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">
                    @if (m.referenceId) {
                      <span class="text-gray-900 dark:text-white">{{ referenceLabel(m.referenceType) }}</span>
                      <span class="ml-1 text-xs text-gray-400">#{{ m.referenceId | slice:0:8 }}</span>
                    } @else {
                      <span class="text-gray-400">—</span>
                    }
                  </td>
                  <td class="max-w-xs truncate px-4 py-2 text-gray-600 dark:text-gray-400">{{ m.notes ?? '—' }}</td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mt-4">
            <app-pagination [currentPage]="movementsQuery.data()?.number ?? 0" [totalPages]="movementsQuery.data()?.totalPages ?? 0" (pageChange)="movementsPage.set($event)" />
          </div>
        </app-data-state>
      </app-data-state>
    </div>
  `,
})
export class InventoryDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly inventory = inject(InventoryService);
  private readonly notification = inject(NotificationService);
  private readonly queryClient = inject(QueryClient);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly itemQuery = injectQuery<InventoryItemResponse>(() => ({
    queryKey: ['inventory-item', this.id],
    queryFn: () => firstValueFrom(this.inventory.get(this.id)),
  }));

  readonly movementsPage = signal(0);

  readonly movementsQuery = injectQuery<Page<InventoryMovementResponse>>(() => ({
    queryKey: ['inventory-movements', this.id, this.movementsPage()],
    queryFn: () => firstValueFrom(this.inventory.getMovements(this.id, this.movementsPage(), 20)),
    staleTime: 30_000,
  }));

  readonly totalEstimatedCost = computed(() => {
    const item = this.itemQuery.data();
    if (!item || !item.costPriceEur) return 0;
    return (item.quantity * item.costPriceEur).toFixed(2);
  });

  readonly showAddForm = signal(false);
  readonly showRemoveForm = signal(false);

  readonly addModel = signal<StockForm>({ quantity: 1, notes: '' });
  readonly addForm = form(this.addModel, (f) => {
    required(f.quantity, { message: 'La cantidad es obligatoria' });
  });

  readonly removeModel = signal<StockForm>({ quantity: 1, notes: '' });
  readonly removeForm = form(this.removeModel, (f) => {
    required(f.quantity, { message: 'La cantidad es obligatoria' });
  });

  readonly addQuantityError = computed(() => {
    const field = this.addForm.quantity();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly removeQuantityError = computed(() => {
    const field = this.removeForm.quantity();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly addMutation = injectMutation<InventoryMovementResponse, Error, { id: string; body: { quantity: number; notes?: string } }>(() => ({
    mutationFn: ({ id, body }) => firstValueFrom(this.inventory.addStock(id, body)),
    onSuccess: () => {
      this.notification.success('Stock añadido correctamente');
      this.showAddForm.set(false);
      this.addModel.set({ quantity: 1, notes: '' });
      this.queryClient.invalidateQueries({ queryKey: ['inventory-item', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['inventory-movements', this.id] });
    },
    onError: () => this.notification.error('Error al añadir stock'),
  }));

  readonly removeMutation = injectMutation<InventoryMovementResponse, Error, { id: string; body: { quantity: number; notes?: string } }>(() => ({
    mutationFn: ({ id, body }) => firstValueFrom(this.inventory.removeStock(id, body)),
    onSuccess: () => {
      this.notification.success('Stock retirado correctamente');
      this.showRemoveForm.set(false);
      this.removeModel.set({ quantity: 1, notes: '' });
      this.queryClient.invalidateQueries({ queryKey: ['inventory-item', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['inventory-movements', this.id] });
    },
    onError: () => this.notification.error('Error al retirar stock'),
  }));

  protected movementTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      INBOUND: 'Entrada',
      OUTBOUND: 'Salida',
      ADJUSTMENT: 'Ajuste',
    };
    return labels[type] ?? type;
  }

  protected referenceLabel(type: string | null): string {
    const labels: Record<string, string> = {
      PURCHASE_ORDER: 'OC',
      DELIVERY_NOTE: 'Albarán',
      MANUAL_ADJUSTMENT: 'Ajuste manual',
      SALE: 'Venta',
    };
    return type ? (labels[type] ?? type) : '—';
  }

  protected sign(m: InventoryMovementResponse): string {
    return m.movementType === 'INBOUND' ? '+' : (m.movementType === 'OUTBOUND' ? '−' : '±');
  }

  protected executeAddStock(id: string): void {
    const m = this.addModel();
    if (m.quantity <= 0) return;
    this.addMutation.mutate({ id, body: { quantity: m.quantity, notes: m.notes || undefined } });
  }

  protected executeRemoveStock(id: string): void {
    const m = this.removeModel();
    if (m.quantity <= 0) return;
    this.removeMutation.mutate({ id, body: { quantity: m.quantity, notes: m.notes || undefined } });
  }

  protected cancelAddStock(): void {
    this.showAddForm.set(false);
    this.addModel.set({ quantity: 1, notes: '' });
  }

  protected cancelRemoveStock(): void {
    this.showRemoveForm.set(false);
    this.removeModel.set({ quantity: 1, notes: '' });
  }
}

import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PurchaseOrderStatus } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-purchase-order-status-actions',
  imports: [ButtonComponent, RouterLink],
  template: `
    <div class="mt-4 flex gap-2">
      @if (status() === 'DRAFT') {
        <app-button variant="primary" size="sm" (clicked)="transition.emit('issue')" [disabled]="isPending()">Emitir</app-button>
        <a [routerLink]="['/purchase-orders', entityId(), 'edit']" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700">Editar</a>
        <app-button variant="secondary" size="sm" (clicked)="cancelRequest.emit()" [disabled]="isPending()">Cancelar</app-button>
      }
      @if (status() === 'ISSUED') {
        <app-button variant="primary" size="sm" (clicked)="transition.emit('receive')" [disabled]="isPending()">Recibir</app-button>
        <app-button variant="secondary" size="sm" (clicked)="cancelRequest.emit()" [disabled]="isPending()">Cancelar</app-button>
      }
      @if (status() === 'RECEIVED') {
        <span class="text-sm text-gray-500 dark:text-gray-400">Recibida — sin acciones disponibles</span>
      }
      @if (status() === 'CANCELLED') {
        <span class="text-sm text-gray-500 dark:text-gray-400">Cancelada — sin acciones disponibles</span>
      }
    </div>
  `,
})
export class PurchaseOrderStatusActionsComponent {
  readonly entityId = input.required<string>();
  readonly status = input.required<PurchaseOrderStatus>();
  readonly isPending = input.required<boolean>();
  readonly transition = output<string>();
  readonly cancelRequest = output<void>();
}

import { Component, inject, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { PurchaseOrderService } from './purchase-order.service';
import { CatalogService } from '../catalog/catalog.service';
import { PurchaseOrderResponse, PurchaseOrderLineResponse, CreatePurchaseOrderLineRequest, PurchaseOrderStatus, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PurchaseOrderStatusActionsComponent } from './purchase-order-status-actions.component';
import { OrderLinesComponent, OrderLineItem, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-purchase-order-detail',
  imports: [StatusBadgeComponent, BackLinkComponent, DataStateComponent, ConfirmDialogComponent, PurchaseOrderStatusActionsComponent, OrderLinesComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/purchase-orders" label="Volver a órdenes de compra" />

      <app-data-state [loading]="poQuery.isPending()" [error]="poQuery.isError() ? 'Error al cargar la orden de compra' : undefined" [empty]="false">
        @let po = poQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ po.poNumber }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ po.supplierName ?? 'Sin proveedor' }}</p>
          </div>
          <app-status-badge [status]="po.status" />
        </div>

        <app-purchase-order-status-actions
          [entityId]="id"
          [status]="po.status"
          [isPending]="statusMutation.isPending()"
          (transition)="transition($event)"
          (cancelRequest)="showCancelDialog.set(true)" />

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Proveedor:</span> {{ po.supplierName ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">CIF/NIF:</span> {{ po.supplierVat ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ po.supplierAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Fecha emisión:</span> {{ po.issueDate }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Fecha prevista:</span> {{ po.expectedDate ?? '—' }}</div>
          @if (po.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ po.notes }}</div>
          }
        </div>

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm font-medium">
          <div><span class="text-gray-700 dark:text-gray-300">Subtotal:</span> {{ po.subtotal.toFixed(2) }} €</div>
          <div><span class="text-gray-700 dark:text-gray-300">IVA:</span> {{ po.vatTotal.toFixed(2) }} €</div>
          <div><span class="text-gray-700 dark:text-gray-300">Total:</span> <strong>{{ po.total.toFixed(2) }} €</strong></div>
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

        <app-data-state [loading]="linesQuery.isPending()" [empty]="false">
          <app-order-lines
            [entityId]="id"
            [lines]="linesQuery.data() ?? []"
            [columns]="columnDefs"
            [canEdit]="po.status === 'DRAFT'"
            [addLineFn]="addLine"
            [removeLineFn]="removeLine"
            [searchFn]="searchProfiles"
            [onSelectResult]="onSelectProfile"
            [invalidateKeys]="invalidateKeys"
            [queryKey]="['purchase-order-lines', id]" />
        </app-data-state>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar orden de compra"
        message="¿Estás seguro de que querés cancelar esta orden de compra? Esta acción no se puede deshacer."
        variant="warning"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />
    </div>
  `,
})
export class PurchaseOrderDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly poService = inject(PurchaseOrderService);
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);
  private readonly notification = inject(NotificationService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly columnDefs: ColumnDef[] = [
    { key: 'lineNumber', label: '#' },
    { key: 'description', label: 'Descripción' },
    { key: 'quantity', label: 'Cantidad' },
    { key: 'unitPrice', label: 'Precio ud.' },
    { key: 'vatRate', label: 'IVA' },
    { key: 'totalPrice', label: 'Total' },
    { key: '', label: '' },
  ];

  readonly poQuery = injectQuery<PurchaseOrderResponse>(() => ({
    queryKey: ['purchase-order', this.id],
    queryFn: () => firstValueFrom(this.poService.get(this.id)),
  }));

  readonly linesQuery = injectQuery<PurchaseOrderLineResponse[]>(() => ({
    queryKey: ['purchase-order-lines', this.id],
    queryFn: () => firstValueFrom(this.poService.getLines(this.id)),
  }));

  readonly statusMutation = injectMutation<PurchaseOrderResponse, Error, string, { previous: PurchaseOrderResponse | undefined }>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => Observable<PurchaseOrderResponse>> = {
        issue: () => this.poService.issue(this.id),
        receive: () => this.poService.receive(this.id),
        cancel: () => this.poService.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onMutate: (action) => {
      const previous = this.queryClient.getQueryData<PurchaseOrderResponse>(['purchase-order', this.id]);
      if (previous) {
        const statusMap: Record<string, PurchaseOrderStatus> = { issue: 'ISSUED', receive: 'RECEIVED', cancel: 'CANCELLED' };
        this.queryClient.setQueryData(['purchase-order', this.id], { ...previous, status: statusMap[action] ?? previous.status });
      }
      return { previous };
    },
    onError: (_err, _action, context) => { if (context?.previous) this.queryClient.setQueryData(['purchase-order', this.id], context.previous); },
    onSuccess: (_data, action) => {
      const messages: Record<string, string> = { issue: 'Orden de compra emitida correctamente', receive: 'Orden de compra recibida correctamente', cancel: 'Orden de compra cancelada' };
      this.notification.success(messages[action] ?? 'Estado actualizado');
    },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['purchase-order', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['purchase-orders'] });
    },
  }));

  readonly showCancelDialog = signal(false);

  readonly addLine = (body: CreateOrderLineItem) => this.poService.addLine(this.id, body as CreatePurchaseOrderLineRequest) as Observable<OrderLineItem>;
  readonly removeLine = (lineId: string) => this.poService.removeLine(this.id, lineId);
  readonly searchProfiles = (q: string) => this.catalog.searchProfiles(q) as Observable<Page<SearchResultItem>>;
  readonly onSelectProfile = (item: SearchResultItem) => ({ description: item.designation, profileId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['purchase-order-lines', this.id], ['purchase-order', this.id], ['purchase-orders']];

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  executeCancel() {
    this.statusMutation.mutate('cancel');
    this.showCancelDialog.set(false);
  }
}

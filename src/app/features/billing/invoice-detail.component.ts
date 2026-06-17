import { Component, inject, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { BillingService } from './billing.service';
import { CatalogService } from '../catalog/catalog.service';
import { InvoiceResponse, InvoiceLineResponse, CreateInvoiceLineRequest, InvoiceStatus, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { PrintService } from '../../core/services/print.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InvoiceStatusActionsComponent } from './invoice-status-actions.component';
import { OrderLinesComponent, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-invoice-detail',
  imports: [StatusBadgeComponent, BackLinkComponent, DataStateComponent, ConfirmDialogComponent, InvoiceStatusActionsComponent, OrderLinesComponent],
  template: `
    <div>
      <app-back-link path="/billing/invoices" label="Volver a facturas" />

      <app-data-state [loading]="invoiceQuery.isPending()" [error]="invoiceQuery.isError() ? 'Error al cargar factura' : undefined" [empty]="false">
        @let inv = invoiceQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ inv.invoiceNumber }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ inv.customerName ?? 'Sin cliente' }}</p>
          </div>
          <app-status-badge [status]="inv.status" />
        </div>

        <app-invoice-status-actions
          [entityId]="id"
          [status]="inv.status"
          [isPending]="statusMutation.isPending()"
          (transition)="transition($event)"
          (cancelRequest)="showCancelDialog.set(true)"
          (exportPdf)="exportPdf()" />

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Fecha:</span> {{ inv.issueDate }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Vencimiento:</span> {{ inv.dueDate ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">CIF/NIF:</span> {{ inv.customerVat ?? '—' }}</div>
          <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ inv.customerAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Subtotal:</span> {{ inv.subtotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">IVA:</span> {{ inv.vatTotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Total:</span> <strong>{{ inv.total.toFixed(2) }} €</strong></div>
          @if (inv.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ inv.notes }}</div>
          }
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

        <app-data-state [loading]="linesQuery.isPending()" [empty]="false">
          <app-order-lines
            [entityId]="id"
            [lines]="linesQuery.data() ?? []"
            [columns]="columnDefs"
            [canEdit]="inv.status === 'DRAFT'"
            [addLineFn]="addLine"
            [removeLineFn]="removeLine"
            [searchFn]="searchItems"
            [onSelectResult]="onSelectItem"
            [invalidateKeys]="invalidateKeys"
            [queryKey]="['invoice-lines', id]" />
        </app-data-state>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar factura"
        message="¿Estás seguro de que querés cancelar esta factura? Esta acción no se puede deshacer."
        variant="warning"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />
    </div>
  `,
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);
  private readonly printService = inject(PrintService);
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

  readonly invoiceQuery = injectQuery<InvoiceResponse>(() => ({
    queryKey: ['invoice', this.id],
    queryFn: () => firstValueFrom(this.billing.getInvoice(this.id)),
  }));

  readonly linesQuery = injectQuery<InvoiceLineResponse[]>(() => ({
    queryKey: ['invoice-lines', this.id],
    queryFn: () => firstValueFrom(this.billing.getInvoiceLines(this.id)),
  }));

  readonly statusMutation = injectMutation<InvoiceResponse, Error, string, { previous: InvoiceResponse | undefined }>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => import('rxjs').Observable<InvoiceResponse>> = {
        issue: () => this.billing.issue(this.id),
        pay: () => this.billing.pay(this.id),
        cancel: () => this.billing.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onMutate: (action) => {
      const previous = this.queryClient.getQueryData<InvoiceResponse>(['invoice', this.id]);
      if (previous) {
        const statusMap: Record<string, InvoiceStatus> = { issue: 'ISSUED', pay: 'PAID', cancel: 'CANCELLED' };
        this.queryClient.setQueryData(['invoice', this.id], { ...previous, status: statusMap[action] ?? previous.status });
      }
      return { previous };
    },
    onError: (_err, _action, context) => { if (context?.previous) this.queryClient.setQueryData(['invoice', this.id], context.previous); },
    onSuccess: (_data, action) => {
      const messages: Record<string, string> = { issue: 'Factura emitida correctamente', pay: 'Factura marcada como pagada', cancel: 'Factura cancelada' };
      this.notification.success(messages[action] ?? 'Estado actualizado');
    },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  }));

  readonly showCancelDialog = signal(false);

  readonly addLine = (body: CreateOrderLineItem) => this.billing.addInvoiceLine(this.id, body as CreateInvoiceLineRequest) as unknown as Observable<never>;
  readonly removeLine = (lineId: string) => this.billing.removeInvoiceLine(this.id, lineId);
  readonly searchItems = (q: string) => this.catalog.searchItems(q) as unknown as Observable<Page<SearchResultItem>>;
  readonly onSelectItem = (item: SearchResultItem) => ({ description: item.designation, itemId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['invoice-lines', this.id], ['invoice', this.id], ['invoices']];

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  executeCancel() {
    this.statusMutation.mutate('cancel');
    this.showCancelDialog.set(false);
  }

  exportPdf() {
    const invoice = this.invoiceQuery.data();
    const lines = this.linesQuery.data();
    if (invoice && lines) this.printService.exportInvoice(invoice, lines);
  }
}

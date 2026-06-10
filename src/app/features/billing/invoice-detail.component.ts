import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { BillingService } from './billing.service';
import { InvoiceResponse, InvoiceLineResponse, CreateInvoiceLineRequest, InvoiceStatus } from '../../core/models/api.types';
import { optimisticRemoveFromArray, optimisticAddToArray, rollbackArray } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PrintService } from '../../core/services/print.service';

@Component({
  selector: 'app-invoice-detail',
  imports: [FormField, ButtonComponent, InputComponent, StatusBadgeComponent, BackLinkComponent, DataStateComponent, TableComponent, CardComponent, ConfirmDialogComponent],
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

        <div class="mt-4 flex gap-2">
          @if (inv.status === 'DRAFT') {
            <app-button variant="primary" size="sm" (clicked)="transition('issue')" [disabled]="statusMutation.isPending()">Emitir</app-button>
            <app-button variant="secondary" size="sm" (clicked)="confirmCancel()" [disabled]="statusMutation.isPending()">Cancelar</app-button>
          }
          @if (inv.status === 'ISSUED') {
            <app-button variant="primary" size="sm" (clicked)="transition('pay')" [disabled]="statusMutation.isPending()">Marcar pagada</app-button>
            <app-button variant="secondary" size="sm" (clicked)="confirmCancel()" [disabled]="statusMutation.isPending()">Cancelar</app-button>
          }
          @if (inv.status === 'ISSUED' || inv.status === 'PAID') {
            <app-button variant="outline" size="sm" (clicked)="exportPdf()">Exportar PDF</app-button>
          }
        </div>

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
          <app-table [columns]="['#', 'Descripción', 'Cantidad', 'Precio ud.', 'IVA', 'Total', '']">
            @for (line of linesQuery.data(); track line.id) {
              <tr>
                <td class="text-gray-600 dark:text-gray-400">{{ line.lineNumber }}</td>
                <td class="text-gray-900 dark:text-white">{{ line.description }}</td>
                <td class="text-gray-600 dark:text-gray-400">{{ line.quantity }}</td>
                <td class="text-gray-600 dark:text-gray-400">{{ line.unitPrice.toFixed(2) }} €</td>
                <td class="text-gray-600 dark:text-gray-400">{{ line.vatRate }}%</td>
                <td class="font-medium text-gray-900 dark:text-white">{{ line.totalPrice.toFixed(2) }} €</td>
                <td>
                  <app-button variant="ghost" size="sm" (clicked)="removeLine(line.id)" [disabled]="deleteLineMutation.isPending()">Eliminar</app-button>
                </td>
              </tr>
            }
          </app-table>

          @if (inv.status === 'DRAFT') {
            <app-card>
              <div body class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Añadir línea</h3>

                <app-input [formField]="lineForm.description" label="Descripción *" />

                <div class="grid grid-cols-3 gap-3">
                  <app-input type="number" [formField]="lineForm.quantity" label="Cantidad *" />
                  <app-input type="number" [formField]="lineForm.unitPrice" label="Precio ud. *" step="0.01" />
                  <app-input type="number" [formField]="lineForm.vatRate" label="IVA %" step="0.01" />
                </div>

                <app-button (clicked)="addLine()" [disabled]="!lineModel().description || !lineModel().quantity || !lineModel().unitPrice || addLineMutation.isPending()">
                  {{ addLineMutation.isPending() ? 'Añadiendo…' : 'Añadir línea' }}
                </app-button>
              </div>
            </app-card>
          }
        </app-data-state>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar factura"
        message="¿Estás seguro de que querés cancelar esta factura? Esta acción no se puede deshacer."
        variant="warning"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />

      <app-confirm-dialog
        [visible]="showDeleteLineDialog()"
        title="Eliminar línea"
        message="¿Estás seguro de que querés eliminar esta línea?"
        variant="danger"
        (confirmed)="executeDeleteLine()"
        (cancelled)="showDeleteLineDialog.set(false)" />
    </div>
  `,
})
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private readonly queryClient = inject(QueryClient);
  private readonly printService = inject(PrintService);

  readonly id = this.route.snapshot.params['id'] as string;

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
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  }));

  readonly addLineMutation = injectMutation<InvoiceLineResponse, Error, CreateInvoiceLineRequest, InvoiceLineResponse[] | undefined>(() => ({
    mutationFn: (body) => firstValueFrom(this.billing.addInvoiceLine(this.id, body)),
    onMutate: (body) => {
      const tempLine: InvoiceLineResponse = {
        id: `temp-${crypto.randomUUID()}`,
        invoiceId: this.id,
        lineNumber: body.lineNumber,
        description: body.description,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        vatRate: body.vatRate,
        totalPrice: body.quantity * body.unitPrice * (1 + body.vatRate / 100),
        profileId: null,
        itemId: null,
      };
      return optimisticAddToArray(this.queryClient, ['invoice-lines', this.id], tempLine);
    },
    onError: (_err, _body, context) => { if (context) rollbackArray(this.queryClient, ['invoice-lines', this.id], context); },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
      this.lineModel.set({ lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 });
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string, InvoiceLineResponse[] | undefined>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.billing.removeInvoiceLine(this.id, lineId)),
    onMutate: (lineId) => optimisticRemoveFromArray<InvoiceLineResponse>(this.queryClient, ['invoice-lines', this.id], lineId),
    onError: (_err, lineId, context) => { if (context) rollbackArray(this.queryClient, ['invoice-lines', this.id], context); },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
    },
  }));

  readonly lineModel = signal<CreateInvoiceLineRequest>({ lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 });

  readonly lineForm = form(this.lineModel);

  readonly showCancelDialog = signal(false);
  readonly showDeleteLineDialog = signal(false);
  private deleteLineTarget = '';

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  confirmCancel() {
    this.showCancelDialog.set(true);
  }

  executeCancel() {
    this.statusMutation.mutate('cancel');
    this.showCancelDialog.set(false);
  }

  addLine() {
    const nextNumber = (this.linesQuery.data()?.length ?? 0) + 1;
    this.addLineMutation.mutate({ ...this.lineModel(), lineNumber: nextNumber });
  }

  exportPdf() {
    const invoice = this.invoiceQuery.data();
    const lines = this.linesQuery.data();
    if (invoice && lines) this.printService.exportInvoice(invoice, lines);
  }

  removeLine(lineId: string) {
    this.deleteLineTarget = lineId;
    this.showDeleteLineDialog.set(true);
  }

  executeDeleteLine() {
    this.deleteLineMutation.mutate(this.deleteLineTarget);
    this.showDeleteLineDialog.set(false);
  }
}

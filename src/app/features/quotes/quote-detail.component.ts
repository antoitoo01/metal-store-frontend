import { Component, inject, signal } from '@angular/core';
import { firstValueFrom, Observable } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { QuoteService } from './quote.service';
import { CatalogService } from '../catalog/catalog.service';
import { QuoteResponse, QuoteLineResponse, CreateQuoteLineRequest, QuoteStatus, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { PrintService } from '../../core/services/print.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { QuoteStatusActionsComponent } from './quote-status-actions.component';
import { OrderLinesComponent, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-quote-detail',
  imports: [StatusBadgeComponent, BackLinkComponent, DataStateComponent, ConfirmDialogComponent, QuoteStatusActionsComponent, OrderLinesComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/quotes" label="Volver a presupuestos" />

      <app-data-state [loading]="quoteQuery.isPending()" [error]="quoteQuery.isError() ? 'Error al cargar presupuesto' : undefined" [empty]="false">
        @let q = quoteQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ q.quoteNumber }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ q.customerName ?? 'Sin cliente' }}</p>
          </div>
          <app-status-badge [status]="q.status" />
        </div>

        <app-quote-status-actions
          [entityId]="id"
          [status]="q.status"
          [isPending]="statusMutation.isPending()"
          (transition)="transition($event)"
          (cancelRequest)="showCancelDialog.set(true)"
          (exportPdf)="exportPdf()" />

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Fecha:</span> {{ q.issueDate }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Válido hasta:</span> {{ q.validUntil ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">CIF/NIF:</span> {{ q.customerVat ?? '—' }}</div>
          <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ q.customerAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Subtotal:</span> {{ q.subtotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">IVA:</span> {{ q.vatTotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Total:</span> <strong>{{ q.total.toFixed(2) }} €</strong></div>
          @if (q.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ q.notes }}</div>
          }
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

        <app-data-state [loading]="linesQuery.isPending()" [empty]="false">
          <app-order-lines
            [entityId]="id"
            [lines]="linesQuery.data() ?? []"
            [columns]="columnDefs"
            [canEdit]="q.status === 'DRAFT'"
            [addLineFn]="addLine"
            [removeLineFn]="removeLine"
            [searchFn]="searchProfiles"
            [onSelectResult]="onSelectProfile"
            [invalidateKeys]="invalidateKeys"
            [queryKey]="['quote-lines', id]" />
        </app-data-state>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar presupuesto"
        message="¿Estás seguro de que querés cancelar este presupuesto? Esta acción no se puede deshacer."
        variant="warning"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />
    </div>
  `,
})
export class QuoteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly quoteService = inject(QuoteService);
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

  readonly quoteQuery = injectQuery<QuoteResponse>(() => ({
    queryKey: ['quote', this.id],
    queryFn: () => firstValueFrom(this.quoteService.get(this.id)),
  }));

  readonly linesQuery = injectQuery<QuoteLineResponse[]>(() => ({
    queryKey: ['quote-lines', this.id],
    queryFn: () => firstValueFrom(this.quoteService.getLines(this.id)),
  }));

  readonly statusMutation = injectMutation<QuoteResponse, Error, string, { previous: QuoteResponse | undefined }>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => import('rxjs').Observable<QuoteResponse>> = {
        issue: () => this.quoteService.issue(this.id),
        accept: () => this.quoteService.accept(this.id),
        reject: () => this.quoteService.reject(this.id),
        cancel: () => this.quoteService.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onMutate: (action) => {
      const previous = this.queryClient.getQueryData<QuoteResponse>(['quote', this.id]);
      if (previous) {
        const statusMap: Record<string, QuoteStatus> = { issue: 'ISSUED', accept: 'ACCEPTED', reject: 'REJECTED', cancel: 'CANCELLED' };
        this.queryClient.setQueryData(['quote', this.id], { ...previous, status: statusMap[action] ?? previous.status });
      }
      return { previous };
    },
    onError: (_err, _action, context) => { if (context?.previous) this.queryClient.setQueryData(['quote', this.id], context.previous); },
    onSuccess: (_data, action) => {
      const messages: Record<string, string> = { issue: 'Presupuesto emitido correctamente', accept: 'Presupuesto aceptado', reject: 'Presupuesto rechazado', cancel: 'Presupuesto cancelado' };
      this.notification.success(messages[action] ?? 'Estado actualizado');
    },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  }));

  readonly showCancelDialog = signal(false);

  readonly addLine = (body: CreateOrderLineItem) => this.quoteService.addLine(this.id, body as CreateQuoteLineRequest) as unknown as Observable<never>;
  readonly removeLine = (lineId: string) => this.quoteService.removeLine(this.id, lineId);
  readonly searchProfiles = (q: string) => this.catalog.searchProfiles(q) as unknown as Observable<Page<SearchResultItem>>;
  readonly onSelectProfile = (item: SearchResultItem) => ({ description: item.designation, profileId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['quote-lines', this.id], ['quote', this.id], ['quotes']];

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  executeCancel() {
    this.statusMutation.mutate('cancel');
    this.showCancelDialog.set(false);
  }

  exportPdf() {
    const quote = this.quoteQuery.data();
    const lines = this.linesQuery.data();
    if (quote && lines) this.printService.exportQuote(quote, lines);
  }
}

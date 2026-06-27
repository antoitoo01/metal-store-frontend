import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom, Observable, map } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { InboundService } from './inbound.service';
import { CatalogService } from '../catalog/catalog.service';
import { InboundDNResponse, InboundDNLineResponse, CreateInboundDNLineRequest, InboundDNStatus, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { InboundStatusActionsComponent } from './inbound-status-actions.component';
import { OrderLinesComponent, OrderLineItem, CreateOrderLineItem, SearchResultItem } from '../../shared/components/order-lines/order-lines.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { ColumnDef } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-inbound-detail',
  imports: [StatusBadgeComponent, BackLinkComponent, DataStateComponent, ConfirmDialogComponent, InboundStatusActionsComponent, OrderLinesComponent, TableComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/inbound" label="Volver a albaranes de entrada" />

      <app-data-state [loading]="dnQuery.isPending()" [error]="dnQuery.isError() ? 'Error al cargar albarán' : undefined" [empty]="false">
        @let dn = dnQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ dn.number }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ dn.supplierName ?? 'Sin proveedor' }}</p>
          </div>
          <app-status-badge [status]="dn.status" />
        </div>

        <app-inbound-status-actions
          [entityId]="id"
          [status]="dn.status"
          [isPending]="statusMutation.isPending()"
          (confirmRequest)="showConfirmDialog.set(true)"
          (cancelRequest)="showCancelDialog.set(true)" />

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Fecha:</span> {{ dn.issueDate }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">CIF/NIF:</span> {{ dn.supplierVat ?? '—' }}</div>
          <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ dn.supplierAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">OC:</span> {{ dn.poNumber ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Total:</span> <strong>{{ dn.totalAmount.toFixed(2) }} €</strong></div>
          @if (dn.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ dn.notes }}</div>
          }
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

        <app-data-state [loading]="linesQuery.isPending()" [empty]="false">
          @if (dn.status === 'DRAFT') {
            <app-order-lines
              [entityId]="id"
              [lines]="orderedLines()"
              [columns]="columnDefs"
              [canEdit]="true"
              [addLineFn]="addLine"
              [removeLineFn]="removeLine"
              [searchFn]="searchProfiles"
              [onSelectResult]="onSelectProfile"
              [invalidateKeys]="invalidateKeys"
              [queryKey]="['inbound-lines', id]" />
          } @else {
            <app-table [columns]="columnDefs">
              @for (line of orderedLines(); track line.id) {
                <tr>
                  <td class="text-gray-600 dark:text-gray-400">{{ line.lineNumber }}</td>
                  <td class="text-gray-900 dark:text-white">{{ line.description }}</td>
                  <td class="text-gray-600 dark:text-gray-400">{{ line.quantity }}</td>
                  <td class="text-gray-600 dark:text-gray-400">{{ line.unitPrice.toFixed(2) }} €</td>
                  <td class="text-gray-600 dark:text-gray-400">{{ line.vatRate }}%</td>
                  <td class="font-medium text-gray-900 dark:text-white">{{ line.totalPrice.toFixed(2) }} €</td>
                  <td></td>
                </tr>
              }
            </app-table>
          }
        </app-data-state>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showConfirmDialog()"
        title="Confirmar entrada"
        message="¿Estás seguro de que querés confirmar esta entrada? Las existencias se actualizarán automáticamente."
        variant="default"
        (confirmed)="executeConfirm()"
        (cancelled)="showConfirmDialog.set(false)" />

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar albarán"
        message="¿Estás seguro de que querés cancelar este albarán? Esta acción no se puede deshacer."
        variant="warning"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />
    </div>
  `,
})
export class InboundDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly inboundService = inject(InboundService);
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

  readonly dnQuery = injectQuery<InboundDNResponse>(() => ({
    queryKey: ['inbound', this.id],
    queryFn: () => firstValueFrom(this.inboundService.get(this.id)),
  }));

  readonly linesQuery = injectQuery<InboundDNLineResponse[]>(() => ({
    queryKey: ['inbound-lines', this.id],
    queryFn: () => firstValueFrom(this.inboundService.getLines(this.id)),
  }));

  readonly orderedLines = computed(() => {
    const lines = this.linesQuery.data();
    if (!lines) return [];
    return lines.map(l => ({
      ...l,
      totalPrice: l.quantity * l.unitPrice * (1 + l.vatRate / 100),
    })) as OrderLineItem[];
  });

  readonly statusMutation = injectMutation<InboundDNResponse, Error, string, { previous: InboundDNResponse | undefined }>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => Observable<InboundDNResponse>> = {
        confirm: () => this.inboundService.confirm(this.id),
        cancel: () => this.inboundService.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onMutate: (action) => {
      const previous = this.queryClient.getQueryData<InboundDNResponse>(['inbound', this.id]);
      if (previous) {
        const statusMap: Record<string, InboundDNStatus> = { confirm: 'CONFIRMED', cancel: 'CANCELLED' };
        this.queryClient.setQueryData(['inbound', this.id], { ...previous, status: statusMap[action] ?? previous.status });
      }
      return { previous };
    },
    onError: (_err, _action, context) => { if (context?.previous) this.queryClient.setQueryData(['inbound', this.id], context.previous); },
    onSuccess: (_data, action) => {
      const messages: Record<string, string> = { confirm: 'Entrada confirmada correctamente', cancel: 'Albarán cancelado' };
      this.notification.success(messages[action] ?? 'Estado actualizado');
    },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['inbound', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['inbound-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['inbound'] });
    },
  }));

  readonly showConfirmDialog = signal(false);
  readonly showCancelDialog = signal(false);

  readonly addLine = (body: CreateOrderLineItem) =>
    this.inboundService.addLine(this.id, body as CreateInboundDNLineRequest).pipe(
      map(line => ({ ...line, totalPrice: line.quantity * line.unitPrice * (1 + line.vatRate / 100) }) as OrderLineItem)
    );
  readonly removeLine = (lineId: string) => this.inboundService.removeLine(this.id, lineId);
  readonly searchProfiles = (q: string) => this.catalog.searchProfiles(q) as Observable<Page<SearchResultItem>>;
  readonly onSelectProfile = (item: SearchResultItem) => ({ description: item.designation, profileId: item.id, quantity: 1, unitPrice: 0, vatRate: 21 } as CreateOrderLineItem);
  readonly invalidateKeys: string[][] = [['inbound-lines', this.id], ['inbound', this.id], ['inbound']];

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  executeConfirm() {
    this.statusMutation.mutate('confirm');
    this.showConfirmDialog.set(false);
  }

  executeCancel() {
    this.statusMutation.mutate('cancel');
    this.showCancelDialog.set(false);
  }
}

import { Component, inject, signal, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { form, FormField } from '@angular/forms/signals';
import { QuoteService } from './quote.service';
import { CatalogService } from '../catalog/catalog.service';
import { QuoteResponse, QuoteLineResponse, CreateQuoteLineRequest, QuoteStatus, CatalogProfile, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { optimisticRemoveFromArray, optimisticAddToArray, rollbackArray } from '../../core/services/optimistic-utils';
import { PrintService } from '../../core/services/print.service';
import { ColumnDef } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-quote-detail',
  imports: [FormField, ButtonComponent, InputComponent, StatusBadgeComponent, BackLinkComponent, DataStateComponent, TableComponent, CardComponent, ConfirmDialogComponent, RouterLink],
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

          <div class="mt-4 flex gap-2">
            @if (q.status === 'DRAFT') {
              <app-button variant="primary" size="sm" (clicked)="transition('issue')" [disabled]="statusMutation.isPending()">Emitir</app-button>
              <a [routerLink]="['/quotes', q.id, 'edit']" class="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 dark:border-gray-600 dark:bg-slate-800 dark:text-gray-300 dark:hover:bg-slate-700">Editar</a>
              <app-button variant="secondary" size="sm" (clicked)="confirmCancel()" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
            @if (q.status === 'ISSUED') {
              <app-button variant="primary" size="sm" (clicked)="transition('accept')" [disabled]="statusMutation.isPending()">Aceptar</app-button>
              <app-button variant="danger" size="sm" (clicked)="transition('reject')" [disabled]="statusMutation.isPending()">Rechazar</app-button>
              <app-button variant="secondary" size="sm" (clicked)="confirmCancel()" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
            @if (q.status === 'ISSUED' || q.status === 'ACCEPTED' || q.status === 'DRAFT') {
              <app-button variant="outline" size="sm" (clicked)="exportPdf()">Exportar PDF</app-button>
            }
          </div>

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
          <app-table [columns]="columnDefs">
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

          @if (q.status === 'DRAFT') {
            <app-card>
              <div body class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Añadir línea</h3>

                <div class="relative">
                  <app-input [formField]="lineForm.description" label="Descripción *" (input)="onDescriptionInput($any($event).target.value)" />
                  @if (showSearchResults()) {
                    <div class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                      @if (searchProfilesQuery.isPending()) {
                        <div class="px-3 py-2 text-sm text-gray-500">Buscando…</div>
                      } @else {
                        @for (p of searchProfilesQuery.data()?.content ?? []; track p.id) {
                          <button type="button" (click)="selectProfile(p)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                            {{ p.designation }}
                          </button>
                        }
                        @if ((searchProfilesQuery.data()?.content?.length ?? 0) === 0) {
                          <div class="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                        }
                      }
                    </div>
                  }
                </div>

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
        title="Cancelar presupuesto"
        message="¿Estás seguro de que querés cancelar este presupuesto? Esta acción no se puede deshacer."
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

  readonly addLineMutation = injectMutation<QuoteLineResponse, Error, CreateQuoteLineRequest, QuoteLineResponse[] | undefined>(() => ({
    mutationFn: (body) => firstValueFrom(this.quoteService.addLine(this.id, body)),
    onMutate: (body) => {
      const tempLine: QuoteLineResponse = {
        id: `temp-${crypto.randomUUID()}`,
        quoteId: this.id,
        lineNumber: body.lineNumber,
        description: body.description,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        vatRate: body.vatRate,
        totalPrice: body.quantity * body.unitPrice * (1 + body.vatRate / 100),
        profileId: body.profileId ?? null,
        itemId: body.itemId ?? null,
      };
      return optimisticAddToArray(this.queryClient, ['quote-lines', this.id], tempLine);
    },
    onError: (_err, _body, context) => { if (context) rollbackArray(this.queryClient, ['quote-lines', this.id], context); },
    onSuccess: () => this.notification.success('Línea añadida correctamente'),
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
      this.lineModel.set({ lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 });
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string, QuoteLineResponse[] | undefined>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.quoteService.removeLine(this.id, lineId)),
    onMutate: (lineId) => optimisticRemoveFromArray<QuoteLineResponse>(this.queryClient, ['quote-lines', this.id], lineId),
    onError: (_err, lineId, context) => { if (context) rollbackArray(this.queryClient, ['quote-lines', this.id], context); },
    onSuccess: () => this.notification.success('Línea eliminada correctamente'),
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
    },
  }));

  readonly lineModel = signal<CreateQuoteLineRequest>({ lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 });

  readonly lineForm = form(this.lineModel);

  readonly showCancelDialog = signal(false);
  readonly showDeleteLineDialog = signal(false);
  private deleteLineTarget = '';

  readonly profileSearch = signal('');
  readonly debouncedSearch = signal('');
  readonly showSearchResults = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly searchProfilesQuery = injectQuery<Page<CatalogProfile>>(() => ({
    queryKey: ['catalog-search', this.debouncedSearch()],
    queryFn: () => firstValueFrom(this.catalog.searchProfiles(this.debouncedSearch())),
    enabled: this.debouncedSearch().length >= 2,
  }));

  onDescriptionInput(value: string) {
    this.profileSearch.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.debouncedSearch.set(this.profileSearch());
      this.showSearchResults.set(this.profileSearch().length >= 2);
    }, 300);
  }

  selectProfile(p: CatalogProfile) {
    this.lineModel.set({ ...this.lineModel(), description: p.designation, profileId: p.id, itemId: undefined });
    this.profileSearch.set(p.designation);
    this.showSearchResults.set(false);
    this.debouncedSearch.set('');
  }

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
    const quote = this.quoteQuery.data();
    const lines = this.linesQuery.data();
    if (quote && lines) this.printService.exportQuote(quote, lines);
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

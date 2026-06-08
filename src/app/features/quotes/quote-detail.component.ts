import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuoteService } from './quote.service';
import { QuoteResponse, QuoteLineResponse, CreateQuoteLineRequest, QuoteStatus } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';
import { optimisticRemoveFromArray, optimisticAddToArray, rollbackArray } from '../../core/services/optimistic-utils';

@Component({
  selector: 'app-quote-detail',
  imports: [FormsModule, ButtonComponent, InputComponent, StatusBadgeComponent, BackLinkComponent, DataStateComponent, TableComponent, CardComponent],
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

        @if (q.status === 'DRAFT' || q.status === 'ISSUED') {
          <div class="mt-4 flex gap-2">
            @if (q.status === 'DRAFT') {
              <app-button variant="primary" size="sm" (clicked)="transition('issue')" [disabled]="statusMutation.isPending()">Emitir</app-button>
              <app-button variant="secondary" size="sm" (clicked)="transition('cancel')" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
            @if (q.status === 'ISSUED') {
              <app-button variant="primary" size="sm" (clicked)="transition('accept')" [disabled]="statusMutation.isPending()">Aceptar</app-button>
              <app-button variant="danger" size="sm" (clicked)="transition('reject')" [disabled]="statusMutation.isPending()">Rechazar</app-button>
              <app-button variant="secondary" size="sm" (clicked)="transition('cancel')" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
          </div>
        }

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

          @if (q.status === 'DRAFT') {
            <app-card>
              <div body class="space-y-3">
                <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Añadir línea</h3>

                <app-input [(ngModel)]="newLine.description" label="Descripción *" [ngModelOptions]="{standalone: true}" />

                <div class="grid grid-cols-3 gap-3">
                  <app-input type="number" [(ngModel)]="newLine.quantity" label="Cantidad *" [ngModelOptions]="{standalone: true}" />
                  <app-input type="number" [(ngModel)]="newLine.unitPrice" label="Precio ud. *" step="0.01" [ngModelOptions]="{standalone: true}" />
                  <app-input type="number" [(ngModel)]="newLine.vatRate" label="IVA %" step="0.01" [ngModelOptions]="{standalone: true}" />
                </div>

                <app-button (clicked)="addLine()" [disabled]="!newLine.description || !newLine.quantity || !newLine.unitPrice || addLineMutation.isPending()">
                  {{ addLineMutation.isPending() ? 'Añadiendo…' : 'Añadir línea' }}
                </app-button>
              </div>
            </app-card>
          }
        </app-data-state>
      </app-data-state>
    </div>
  `,
})
export class QuoteDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly quoteService = inject(QuoteService);
  private readonly queryClient = inject(QueryClient);

  readonly id = this.route.snapshot.params['id'] as string;

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
        profileId: null,
        itemId: null,
      };
      return optimisticAddToArray(this.queryClient, ['quote-lines', this.id], tempLine);
    },
    onError: (_err, _body, context) => { if (context) rollbackArray(this.queryClient, ['quote-lines', this.id], context); },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
      this.newLine = { lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 };
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string, QuoteLineResponse[] | undefined>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.quoteService.removeLine(this.id, lineId)),
    onMutate: (lineId) => optimisticRemoveFromArray<QuoteLineResponse>(this.queryClient, ['quote-lines', this.id], lineId),
    onError: (_err, lineId, context) => { if (context) rollbackArray(this.queryClient, ['quote-lines', this.id], context); },
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
    },
  }));

  newLine: CreateQuoteLineRequest = { lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 };

  transition(action: string) {
    this.statusMutation.mutate(action);
  }

  addLine() {
    const nextNumber = (this.linesQuery.data()?.length ?? 0) + 1;
    this.addLineMutation.mutate({ ...this.newLine, lineNumber: nextNumber });
  }

  removeLine(lineId: string) {
    this.deleteLineMutation.mutate(lineId);
  }
}

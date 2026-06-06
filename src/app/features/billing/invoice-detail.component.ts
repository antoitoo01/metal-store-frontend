import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { InvoiceResponse, InvoiceLineResponse, CreateInvoiceLineRequest } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { CardComponent } from '../../shared/components/card.component';

@Component({
  selector: 'app-invoice-detail',
  imports: [FormsModule, ButtonComponent, InputComponent, StatusBadgeComponent, BackLinkComponent, DataStateComponent, TableComponent, CardComponent],
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

        @if (inv.status === 'DRAFT' || inv.status === 'ISSUED') {
          <div class="mt-4 flex gap-2">
            @if (inv.status === 'DRAFT') {
              <app-button variant="primary" size="sm" (clicked)="transition('issue')" [disabled]="statusMutation.isPending()">Emitir</app-button>
              <app-button variant="secondary" size="sm" (clicked)="transition('cancel')" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
            @if (inv.status === 'ISSUED') {
              <app-button variant="primary" size="sm" (clicked)="transition('pay')" [disabled]="statusMutation.isPending()">Marcar pagada</app-button>
              <app-button variant="secondary" size="sm" (clicked)="transition('cancel')" [disabled]="statusMutation.isPending()">Cancelar</app-button>
            }
          </div>
        }

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

                <app-input [(ngModel)]="newLine.description" label="Descripción *" [ngModelOptions]="{standalone: true}" />

                <div class="grid grid-cols-3 gap-3">
                  <app-input type="number" [(ngModel)]="newLine.quantity" label="Cantidad *" [ngModelOptions]="{standalone: true}" />
                  <app-input type="number" step="0.01" [(ngModel)]="newLine.unitPrice" label="Precio ud. *" [ngModelOptions]="{standalone: true}" />
                  <app-input type="number" step="0.01" [(ngModel)]="newLine.vatRate" label="IVA %" [ngModelOptions]="{standalone: true}" />
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
export class InvoiceDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly billing = inject(BillingService);
  private readonly queryClient = inject(QueryClient);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly invoiceQuery = injectQuery<InvoiceResponse>(() => ({
    queryKey: ['invoice', this.id],
    queryFn: () => firstValueFrom(this.billing.getInvoice(this.id)),
  }));

  readonly linesQuery = injectQuery<InvoiceLineResponse[]>(() => ({
    queryKey: ['invoice-lines', this.id],
    queryFn: () => firstValueFrom(this.billing.getInvoiceLines(this.id)),
  }));

  readonly statusMutation = injectMutation<InvoiceResponse, Error, string>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => import('rxjs').Observable<InvoiceResponse>> = {
        issue: () => this.billing.issue(this.id),
        pay: () => this.billing.pay(this.id),
        cancel: () => this.billing.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoices'] });
    },
  }));

  readonly addLineMutation = injectMutation<InvoiceLineResponse, Error, CreateInvoiceLineRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.billing.addInvoiceLine(this.id, body)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
      this.newLine = { lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 };
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.billing.removeInvoiceLine(this.id, lineId)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['invoice-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['invoice', this.id] });
    },
  }));

  newLine: CreateInvoiceLineRequest = { lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 };

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

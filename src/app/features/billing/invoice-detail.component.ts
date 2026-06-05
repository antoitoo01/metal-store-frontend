import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { BillingService } from './billing.service';
import { InvoiceResponse, InvoiceLineResponse, CreateInvoiceLineRequest } from '../../core/models/api.types';

@Component({
  selector: 'app-invoice-detail',
  imports: [RouterLink, FormsModule],
  template: `
    <div>
      <a routerLink="/billing/invoices" class="text-sm text-blue-600 hover:underline">← Volver a facturas</a>

      @if (invoiceQuery.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (invoiceQuery.error()) {
        <p class="mt-4 text-red-600">Error al cargar factura</p>
      } @else {
        @let inv = invoiceQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ inv.invoiceNumber }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ inv.customerName ?? 'Sin cliente' }}</p>
          </div>
          <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold"
            [class]="statusClass(inv.status)">{{ inv.status }}</span>
        </div>

        @if (inv.status === 'DRAFT' || inv.status === 'ISSUED') {
          <div class="mt-4 flex gap-2">
            @if (inv.status === 'DRAFT') {
              <button (click)="transition('issue')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Emitir</button>
              <button (click)="transition('cancel')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
            }
            @if (inv.status === 'ISSUED') {
              <button (click)="transition('pay')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Marcar pagada</button>
              <button (click)="transition('cancel')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
            }
          </div>
        }

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700">Fecha:</span> {{ inv.issueDate }}</div>
          <div><span class="font-medium text-gray-700">Vencimiento:</span> {{ inv.dueDate ?? '—' }}</div>
          <div><span class="font-medium text-gray-700">CIF/NIF:</span> {{ inv.customerVat ?? '—' }}</div>
          <div class="col-span-3"><span class="font-medium text-gray-700">Dirección:</span> {{ inv.customerAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700">Subtotal:</span> {{ inv.subtotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700">IVA:</span> {{ inv.vatTotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700">Total:</span> <strong>{{ inv.total.toFixed(2) }} €</strong></div>
          @if (inv.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700">Notas:</span> {{ inv.notes }}</div>
          }
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900">Líneas</h2>

        @if (linesQuery.isPending()) {
          <p class="mt-2 text-sm text-gray-500">Cargando líneas…</p>
        } @else {
          <table class="mt-2 w-full text-left text-sm">
            <thead>
              <tr class="border-b text-gray-600">
                <th class="py-2 pr-4 font-medium">#</th>
                <th class="py-2 pr-4 font-medium">Descripción</th>
                <th class="py-2 pr-4 font-medium">Cantidad</th>
                <th class="py-2 pr-4 font-medium">Precio ud.</th>
                <th class="py-2 pr-4 font-medium">IVA</th>
                <th class="py-2 pr-4 font-medium">Total</th>
                <th class="py-2 pr-4 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              @for (line of linesQuery.data(); track line.id) {
                <tr class="border-b hover:bg-gray-50">
                  <td class="py-2 pr-4 text-gray-600">{{ line.lineNumber }}</td>
                  <td class="py-2 pr-4 text-gray-900">{{ line.description }}</td>
                  <td class="py-2 pr-4 text-gray-600">{{ line.quantity }}</td>
                  <td class="py-2 pr-4 text-gray-600">{{ line.unitPrice.toFixed(2) }} €</td>
                  <td class="py-2 pr-4 text-gray-600">{{ line.vatRate }}%</td>
                  <td class="py-2 pr-4 font-medium text-gray-900">{{ line.totalPrice.toFixed(2) }} €</td>
                  <td class="py-2">
                    <button (click)="removeLine(line.id)" [disabled]="deleteLineMutation.isPending()"
                      class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">Eliminar</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>

          @if (inv.status === 'DRAFT') {
            <div class="mt-6 max-w-lg space-y-3 rounded-lg border p-4">
              <h3 class="text-sm font-semibold text-gray-700">Añadir línea</h3>

              <div>
                <label class="block text-sm text-gray-600">Descripción *</label>
                <input [(ngModel)]="newLine.description" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>

              <div class="grid grid-cols-3 gap-3">
                <div>
                  <label class="block text-sm text-gray-600">Cantidad *</label>
                  <input type="number" [(ngModel)]="newLine.quantity" min="1" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600">Precio ud. *</label>
                  <input type="number" step="0.01" [(ngModel)]="newLine.unitPrice" min="0" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
                <div>
                  <label class="block text-sm text-gray-600">IVA %</label>
                  <input type="number" step="0.01" [(ngModel)]="newLine.vatRate" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
                </div>
              </div>

              <button (click)="addLine()" [disabled]="!newLine.description || !newLine.quantity || !newLine.unitPrice || addLineMutation.isPending()"
                class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
                {{ addLineMutation.isPending() ? 'Añadiendo…' : 'Añadir línea' }}
              </button>
            </div>
          }
        }
      }
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

  statusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ISSUED: 'bg-blue-100 text-blue-700',
      PAID: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }
}

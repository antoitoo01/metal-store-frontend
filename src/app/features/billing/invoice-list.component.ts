import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-invoice-list',
  imports: [RouterLink],
  template: `
    <div>
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900">Facturas</h2>
        <a routerLink="/billing/invoices/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nueva factura</a>
      </div>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar facturas</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Número</th>
              <th class="py-2 pr-4 font-medium">Cliente</th>
              <th class="py-2 pr-4 font-medium">Fecha</th>
              <th class="py-2 pr-4 font-medium">Vencimiento</th>
              <th class="py-2 pr-4 font-medium">Total</th>
              <th class="py-2 pr-4 font-medium">Estado</th>
              <th class="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            @for (inv of query.data()?.content; track inv.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-medium text-gray-900">{{ inv.invoiceNumber }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ inv.customerName ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ inv.issueDate }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ inv.dueDate ?? '—' }}</td>
                <td class="py-2 pr-4 font-medium text-gray-900">{{ inv.total.toFixed(2) }} €</td>
                <td class="py-2 pr-4">
                  <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class]="statusClass(inv.status)">{{ inv.status }}</span>
                </td>
                <td class="py-2">
                  <a [routerLink]="[inv.id]" class="text-sm text-blue-600 hover:text-blue-800">Ver</a>
                </td>
              </tr>
            }
          </tbody>
        </table>

        @if (query.data() && !query.data()!.empty) {
          <div class="mt-4 flex items-center gap-2 text-sm">
            <button (click)="goTo(query.data()!.number - 1)" [disabled]="query.data()!.first"
              class="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Anterior</button>
            <span class="text-gray-600">Página {{ (query.data()?.number ?? 0) + 1 }} de {{ query.data()?.totalPages ?? 0 }}</span>
            <button (click)="goTo(query.data()!.number + 1)" [disabled]="query.data()!.last"
              class="rounded px-2 py-1 text-gray-600 hover:bg-gray-100 disabled:opacity-30">Siguiente</button>
          </div>
        }
      }
    </div>
  `,
})
export class InvoiceListComponent {
  private readonly billing = inject(BillingService);

  readonly page = signal(0);
  readonly size = 20;

  readonly query = injectQuery<Page<InvoiceResponse>>(() => ({
    queryKey: ['invoices', { page: this.page() }],
    queryFn: () => firstValueFrom(this.billing.invoices(this.page(), this.size)),
  }));

  goTo(p: number) {
    this.page.set(p);
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

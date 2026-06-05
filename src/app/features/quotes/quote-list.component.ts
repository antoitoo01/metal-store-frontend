import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { QuoteService } from './quote.service';
import { QuoteResponse, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-quote-list',
  imports: [RouterLink],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900">Presupuestos</h1>
        <a routerLink="/quotes/new"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">Nuevo presupuesto</a>
      </div>

      @if (query.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (query.error()) {
        <p class="mt-4 text-red-600">Error al cargar presupuestos</p>
      } @else {
        <table class="mt-4 w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Número</th>
              <th class="py-2 pr-4 font-medium">Cliente</th>
              <th class="py-2 pr-4 font-medium">Fecha</th>
              <th class="py-2 pr-4 font-medium">Válido hasta</th>
              <th class="py-2 pr-4 font-medium">Total</th>
              <th class="py-2 pr-4 font-medium">Estado</th>
              <th class="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            @for (q of query.data()?.content; track q.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 font-medium text-gray-900">{{ q.quoteNumber }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ q.customerName ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ q.issueDate }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ q.validUntil ?? '—' }}</td>
                <td class="py-2 pr-4 font-medium text-gray-900">{{ q.total.toFixed(2) }} €</td>
                <td class="py-2 pr-4">
                  <span class="inline-block rounded-full px-2 py-0.5 text-xs font-semibold"
                    [class]="statusClass(q.status)">{{ q.status }}</span>
                </td>
                <td class="py-2">
                  <a [routerLink]="[q.id]" class="text-sm text-blue-600 hover:text-blue-800">Ver</a>
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
export class QuoteListComponent {
  private readonly quoteService = inject(QuoteService);

  readonly page = signal(0);
  readonly size = 20;

  readonly query = injectQuery<Page<QuoteResponse>>(() => ({
    queryKey: ['quotes', { page: this.page() }],
    queryFn: () => firstValueFrom(this.quoteService.list(this.page(), this.size)),
  }));

  goTo(p: number) {
    this.page.set(p);
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'bg-gray-100 text-gray-700',
      ISSUED: 'bg-blue-100 text-blue-700',
      ACCEPTED: 'bg-green-100 text-green-700',
      REJECTED: 'bg-red-100 text-red-700',
      CANCELLED: 'bg-yellow-100 text-yellow-700',
    };
    return map[status] ?? 'bg-gray-100 text-gray-700';
  }
}

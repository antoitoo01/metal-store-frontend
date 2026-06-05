import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { QuoteService } from './quote.service';
import { QuoteResponse, QuoteLineResponse, CreateQuoteLineRequest } from '../../core/models/api.types';

@Component({
  selector: 'app-quote-detail',
  imports: [RouterLink, FormsModule],
  template: `
    <div class="p-6">
      <a routerLink="/quotes" class="text-sm text-blue-600 hover:underline">← Volver a presupuestos</a>

      @if (quoteQuery.isPending()) {
        <p class="mt-4 text-gray-500">Cargando…</p>
      } @else if (quoteQuery.error()) {
        <p class="mt-4 text-red-600">Error al cargar presupuesto</p>
      } @else {
        @let q = quoteQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900">{{ q.quoteNumber }}</h1>
            <p class="mt-1 text-sm text-gray-500">{{ q.customerName ?? 'Sin cliente' }}</p>
          </div>
          <span class="inline-block rounded-full px-3 py-1 text-xs font-semibold"
            [class]="statusClass(q.status)">{{ q.status }}</span>
        </div>

        @if (q.status === 'DRAFT' || q.status === 'ISSUED') {
          <div class="mt-4 flex gap-2">
            @if (q.status === 'DRAFT') {
              <button (click)="transition('issue')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">Emitir</button>
              <button (click)="transition('cancel')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
            }
            @if (q.status === 'ISSUED') {
              <button (click)="transition('accept')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-green-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50">Aceptar</button>
              <button (click)="transition('reject')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50">Rechazar</button>
              <button (click)="transition('cancel')" [disabled]="statusMutation.isPending()"
                class="rounded-lg bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-700 hover:bg-gray-300 disabled:opacity-50">Cancelar</button>
            }
          </div>
        }

        <div class="mt-6 grid grid-cols-3 gap-4 text-sm">
          <div><span class="font-medium text-gray-700">Fecha:</span> {{ q.issueDate }}</div>
          <div><span class="font-medium text-gray-700">Válido hasta:</span> {{ q.validUntil ?? '—' }}</div>
          <div><span class="font-medium text-gray-700">CIF/NIF:</span> {{ q.customerVat ?? '—' }}</div>
          <div class="col-span-3"><span class="font-medium text-gray-700">Dirección:</span> {{ q.customerAddress ?? '—' }}</div>
          <div><span class="font-medium text-gray-700">Subtotal:</span> {{ q.subtotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700">IVA:</span> {{ q.vatTotal.toFixed(2) }} €</div>
          <div><span class="font-medium text-gray-700">Total:</span> <strong>{{ q.total.toFixed(2) }} €</strong></div>
          @if (q.notes) {
            <div class="col-span-3"><span class="font-medium text-gray-700">Notas:</span> {{ q.notes }}</div>
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

          @if (q.status === 'DRAFT') {
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

  readonly statusMutation = injectMutation<QuoteResponse, Error, string>(() => ({
    mutationFn: (action) => {
      const map: Record<string, () => import('rxjs').Observable<QuoteResponse>> = {
        issue: () => this.quoteService.issue(this.id),
        accept: () => this.quoteService.accept(this.id),
        reject: () => this.quoteService.reject(this.id),
        cancel: () => this.quoteService.cancel(this.id),
      };
      return firstValueFrom(map[action]());
    },
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quotes'] });
    },
  }));

  readonly addLineMutation = injectMutation<QuoteLineResponse, Error, CreateQuoteLineRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.quoteService.addLine(this.id, body)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['quote-lines', this.id] });
      this.queryClient.invalidateQueries({ queryKey: ['quote', this.id] });
      this.newLine = { lineNumber: 0, description: '', quantity: 1, unitPrice: 0, vatRate: 21 };
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.quoteService.removeLine(this.id, lineId)),
    onSuccess: () => {
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

import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, RouterLink } from '@angular/router';
import { QuoteService } from './quote.service';
import { ClientService } from '../clients/client.service';
import { QuoteResponse, ClientResponse, Page, CreateQuoteRequest } from '../../core/models/api.types';

@Component({
  selector: 'app-quote-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6">
      <a routerLink="/quotes" class="text-sm text-blue-600 hover:underline">← Volver a presupuestos</a>

      <h1 class="mt-2 text-2xl font-bold text-gray-900">Nuevo presupuesto</h1>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Cliente</label>
          <select formControlName="clientId" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
            <option value="">— Sin cliente —</option>
            @for (c of clients.data()?.content ?? []; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Nombre del cliente (libre)</label>
          <input formControlName="customerName" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">CIF / NIF</label>
          <input formControlName="customerVat" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Dirección</label>
          <input formControlName="customerAddress" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Válido hasta</label>
          <input type="date" formControlName="validUntil" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Notas</label>
          <textarea formControlName="notes" rows="3" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
        </div>

        <button type="submit" [disabled]="saveMutation.isPending()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear presupuesto' }}
        </button>
      </form>
    </div>
  `,
})
export class QuoteFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly quoteService = inject(QuoteService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    clientId: [''],
    customerName: [''],
    customerVat: [''],
    customerAddress: [''],
    validUntil: [''],
    notes: [''],
  });

  readonly clients = injectQuery<Page<ClientResponse>>(() => ({
    queryKey: ['clients', { page: 0, size: 200 }],
    queryFn: () => firstValueFrom(this.clientService.list(0, 200)),
  }));

  readonly saveMutation = injectMutation<QuoteResponse, Error, CreateQuoteRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.quoteService.create(body)),
    onSuccess: (q) => this.router.navigate(['/quotes', q.id]),
  }));

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    this.saveMutation.mutate({
      clientId: raw.clientId || undefined,
      customerName: raw.customerName || undefined,
      customerVat: raw.customerVat || undefined,
      customerAddress: raw.customerAddress || undefined,
      validUntil: raw.validUntil || undefined,
      notes: raw.notes || undefined,
    } as CreateQuoteRequest);
  }
}

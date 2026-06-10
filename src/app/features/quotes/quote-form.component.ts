import { Component, inject } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { QuoteService } from './quote.service';
import { ClientService } from '../clients/client.service';
import { QuoteResponse, ClientResponse, Page, CreateQuoteRequest } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';

interface QuoteFormData {
  clientId: string;
  customerName: string;
  customerVat: string;
  customerAddress: string;
  validUntil: string;
  notes: string;
}

@Component({
  selector: 'app-quote-form',
  imports: [FormField, ButtonComponent, BackLinkComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/quotes" label="Volver a presupuestos" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Nuevo presupuesto</h1>

      <form (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="clientId">Cliente</label>
          <select id="clientId" [formField]="form.clientId" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:border-gray-600">
            <option value="">— Sin cliente —</option>
            @for (c of clients.data()?.content ?? []; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerName">Nombre del cliente (libre)</label>
          <input id="customerName" [formField]="form.customerName" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerVat">CIF / NIF</label>
          <input id="customerVat" [formField]="form.customerVat" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerAddress">Dirección</label>
          <input id="customerAddress" [formField]="form.customerAddress" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="validUntil">Válido hasta</label>
          <input id="validUntil" type="date" [formField]="form.validUntil" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="notes">Notas</label>
          <textarea id="notes" [formField]="form.notes" rows="3" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600"></textarea>
        </div>

        <app-button type="submit" [disabled]="saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear presupuesto' }}
        </app-button>
      </form>
    </div>
  `,
})
export class QuoteFormComponent {
  private readonly quoteService = inject(QuoteService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);

  readonly model = signal<QuoteFormData>({
    clientId: '',
    customerName: '',
    customerVat: '',
    customerAddress: '',
    validUntil: '',
    notes: '',
  });

  readonly form = form(this.model);

  readonly clients = injectQuery<Page<ClientResponse>>(() => ({
    queryKey: ['clients', { page: 0, size: 200 }],
    queryFn: () => firstValueFrom(this.clientService.list(0, 200)),
  }));

  readonly saveMutation = injectMutation<QuoteResponse, Error, CreateQuoteRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.quoteService.create(body)),
    onSuccess: (q) => this.router.navigate(['/quotes', q.id]),
  }));

  save(): void {
    if (this.form().invalid()) return;
    const m = this.model();
    this.saveMutation.mutate({
      clientId: m.clientId || undefined,
      customerName: m.customerName || undefined,
      customerVat: m.customerVat || undefined,
      customerAddress: m.customerAddress || undefined,
      validUntil: m.validUntil || undefined,
      notes: m.notes || undefined,
    } as CreateQuoteRequest);
  }
}

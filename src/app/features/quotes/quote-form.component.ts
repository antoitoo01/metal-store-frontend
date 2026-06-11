import { Component, inject, effect, afterNextRender } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { QuoteService } from './quote.service';
import { ClientService } from '../clients/client.service';
import { QuoteResponse, ClientResponse, Page, CreateQuoteRequest } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';

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

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto' }}</h1>

      <form (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="clientId">Cliente</label>
          @if (isEdit) {
            <p class="text-sm text-gray-500 dark:text-gray-400">{{ existing.data()?.customerName ?? '—' }}</p>
          } @else {
            <select id="clientId" [formField]="form.clientId" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:border-gray-600">
              <option value="">— Sin cliente —</option>
              @for (c of clients.data()?.content ?? []; track c.id) {
                <option [value]="c.id">{{ c.name }}</option>
              }
            </select>
          }
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerName">Nombre del cliente</label>
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

        <app-button type="submit" [disabled]="saveMutation.isPending() || saveMutation.isSuccess()">
          {{ saveMutation.isPending() ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear presupuesto') }}
        </app-button>
      </form>
    </div>
  `,
})
export class QuoteFormComponent {
  private readonly quoteService = inject(QuoteService);
  private readonly clientService = inject(ClientService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

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
    enabled: !this.isEdit,
    queryFn: () => firstValueFrom(this.clientService.list(0, 200)),
  }));

  readonly existing = injectQuery<QuoteResponse>(() => ({
    queryKey: ['quote', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.quoteService.get(this.id!)),
  }));

  readonly saveMutation = injectMutation<QuoteResponse, Error, CreateQuoteRequest | Partial<QuoteFormData>>(() => ({
    mutationFn: (body) => firstValueFrom(
      this.isEdit ? this.quoteService.update(this.id!, body) : this.quoteService.create(body as CreateQuoteRequest)
    ),
    onSuccess: (q) => {
      this.notification.success(this.isEdit ? 'Presupuesto actualizado correctamente' : 'Presupuesto creado correctamente');
      this.router.navigate(['/quotes', q.id]);
    },
  }));

  constructor() {
    afterNextRender(() => document.getElementById('customerName')?.focus());
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) this.model.set({
          clientId: data.clientId ?? '',
          customerName: data.customerName ?? '',
          customerVat: data.customerVat ?? '',
          customerAddress: data.customerAddress ?? '',
          validUntil: data.validUntil ?? '',
          notes: data.notes ?? '',
        });
      });
    }
  }

  save(): void {
    if (this.form().invalid()) return;
    if (this.isEdit) {
      const m = this.model();
      this.saveMutation.mutate({
        customerName: m.customerName || undefined,
        customerVat: m.customerVat || undefined,
        customerAddress: m.customerAddress || undefined,
        validUntil: m.validUntil || undefined,
        notes: m.notes || undefined,
      });
    } else {
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
}

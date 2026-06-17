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
import { InputComponent } from '../../shared/components/input/input.component';

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
  imports: [FormField, ButtonComponent, BackLinkComponent, InputComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/quotes" label="Volver a presupuestos" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ isEdit ? 'Editar presupuesto' : 'Nuevo presupuesto' }}</h1>

      <form (submit)="save($event)" class="mt-6 max-w-lg space-y-4">
        @if (isEdit) {
          <p class="text-sm text-gray-500 dark:text-gray-400">{{ existing.data()?.customerName ?? '—' }}</p>
        } @else {
          <app-input variant="select" [formField]="form.clientId" label="Cliente">
            <option value="">— Sin cliente —</option>
            @for (c of clients.data()?.content ?? []; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </app-input>
        }

        <app-input
          id="customerName"
          [formField]="form.customerName"
          label="Nombre del cliente"
        />

        <app-input
          [formField]="form.customerVat"
          label="CIF / NIF"
        />

        <app-input
          [formField]="form.customerAddress"
          label="Dirección"
        />

        <app-input
          type="date"
          [formField]="form.validUntil"
          label="Válido hasta"
        />

        <app-input
          variant="textarea"
          [formField]="form.notes"
          label="Notas"
        />

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

  save(event: Event): void {
    event.preventDefault();
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

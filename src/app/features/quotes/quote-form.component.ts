import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { QuoteService } from './quote.service';
import { ClientService } from '../clients/client.service';
import { QuoteResponse, ClientResponse, Page, CreateQuoteRequest } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';

@Component({
  selector: 'app-quote-form',
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, BackLinkComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/quotes" label="Volver a presupuestos" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">Nuevo presupuesto</h1>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <app-input formControlName="clientId" label="Cliente" variant="select">
          <option value="">— Sin cliente —</option>
          @for (c of clients.data()?.content ?? []; track c.id) {
            <option [value]="c.id">{{ c.name }}</option>
          }
        </app-input>

        <app-input formControlName="customerName" label="Nombre del cliente (libre)" />
        <app-input formControlName="customerVat" label="CIF / NIF" />
        <app-input formControlName="customerAddress" label="Dirección" />
        <app-input formControlName="validUntil" label="Válido hasta" type="date" />

        <app-input formControlName="notes" label="Notas" variant="textarea" />

        <app-button type="submit" [disabled]="saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear presupuesto' }}
        </app-button>
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

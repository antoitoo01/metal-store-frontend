import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { Router, RouterLink } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse } from '../../core/models/api.types';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div>
      <a routerLink="/billing/invoices" class="text-sm text-blue-600 hover:underline">← Volver a facturas</a>

      <h2 class="mt-2 text-lg font-semibold text-gray-900">Nueva factura</h2>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-4 max-w-lg space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Cliente</label>
          <input formControlName="customerName" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium text-gray-700">CIF / NIF</label>
          <input formControlName="customerVat" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <button type="submit" [disabled]="saveMutation.isPending()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear factura' }}
        </button>
      </form>
    </div>
  `,
})
export class InvoiceFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly billing = inject(BillingService);
  private readonly router = inject(Router);

  readonly form = this.fb.group({
    customerName: [''],
    customerVat: [''],
  });

  readonly saveMutation = injectMutation<InvoiceResponse, Error, { customerName?: string; customerVat?: string }>(() => ({
    mutationFn: ({ customerName, customerVat }) =>
      firstValueFrom(this.billing.createInvoice(customerName, customerVat)),
    onSuccess: (inv) => this.router.navigate(['/billing/invoices', inv.id]),
  }));

  save() {
    const raw = this.form.value;
    this.saveMutation.mutate({
      customerName: raw.customerName || undefined,
      customerVat: raw.customerVat || undefined,
    });
  }
}

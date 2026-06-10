import { Component, inject } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';

interface InvoiceFormData {
  customerName: string;
  customerVat: string;
}

@Component({
  selector: 'app-invoice-form',
  imports: [FormField, ButtonComponent, BackLinkComponent],
  template: `
    <div>
      <app-back-link path="/billing/invoices" label="Volver a facturas" />

      <h2 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Nueva factura</h2>

      <form (ngSubmit)="save()" class="mt-4 max-w-lg space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerName">Cliente</label>
          <input id="customerName" [formField]="form.customerName" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerVat">CIF / NIF</label>
          <input id="customerVat" [formField]="form.customerVat" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600" />
        </div>

        <app-button type="submit" [disabled]="saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear factura' }}
        </app-button>
      </form>
    </div>
  `,
})
export class InvoiceFormComponent {
  private readonly billing = inject(BillingService);
  private readonly router = inject(Router);

  readonly model = signal<InvoiceFormData>({
    customerName: '',
    customerVat: '',
  });

  readonly form = form(this.model);

  readonly saveMutation = injectMutation<InvoiceResponse, Error, { customerName?: string; customerVat?: string }>(() => ({
    mutationFn: ({ customerName, customerVat }) =>
      firstValueFrom(this.billing.createInvoice(customerName, customerVat)),
    onSuccess: (inv) => this.router.navigate(['/billing/invoices', inv.id]),
  }));

  save() {
    if (this.form().invalid()) return;
    const m = this.model();
    this.saveMutation.mutate({
      customerName: m.customerName || undefined,
      customerVat: m.customerVat || undefined,
    });
  }
}

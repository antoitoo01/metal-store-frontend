import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { Router } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';

@Component({
  selector: 'app-invoice-form',
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, BackLinkComponent],
  template: `
    <div>
      <app-back-link path="/billing/invoices" label="Volver a facturas" />

      <h2 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">Nueva factura</h2>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-4 max-w-lg space-y-4">
        <app-input formControlName="customerName" label="Cliente" />
        <app-input formControlName="customerVat" label="CIF / NIF" />
        <app-button type="submit" [disabled]="saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Creando…' : 'Crear factura' }}
        </app-button>
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

import { Component, inject, effect, afterNextRender } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { BillingService } from './billing.service';
import { InvoiceResponse } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';

interface InvoiceFormData {
  customerName: string;
  customerVat: string;
  customerAddress: string;
  notes: string;
}

@Component({
  selector: 'app-invoice-form',
  imports: [FormField, ButtonComponent, BackLinkComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/billing/invoices" label="Volver a facturas" />

      <h2 class="mt-2 text-lg font-semibold text-gray-900 dark:text-white">{{ isEdit ? 'Editar factura' : 'Nueva factura' }}</h2>

      <form (ngSubmit)="save()" class="mt-4 max-w-lg space-y-4">
        <div class="flex flex-col gap-1.5">
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="customerName">Cliente</label>
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
          <label class="text-sm font-medium text-gray-700 dark:text-gray-300" for="notes">Notas</label>
          <textarea id="notes" [formField]="form.notes" rows="3" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600"></textarea>
        </div>

        <app-button type="submit" [disabled]="saveMutation.isPending() || saveMutation.isSuccess()">
          {{ saveMutation.isPending() ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Crear factura') }}
        </app-button>
      </form>
    </div>
  `,
})
export class InvoiceFormComponent {
  private readonly billing = inject(BillingService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly model = signal<InvoiceFormData>({
    customerName: '',
    customerVat: '',
    customerAddress: '',
    notes: '',
  });

  readonly form = form(this.model);

  readonly existing = injectQuery<InvoiceResponse>(() => ({
    queryKey: ['invoice', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.billing.getInvoice(this.id!)),
  }));

  readonly saveMutation = injectMutation<InvoiceResponse, Error, Partial<InvoiceFormData>>(() => ({
    mutationFn: (body) => firstValueFrom(
      this.isEdit ? this.billing.updateInvoice(this.id!, body) : this.billing.createInvoice(body.customerName ?? undefined, body.customerVat ?? undefined)
    ),
    onSuccess: (inv) => {
      this.notification.success(this.isEdit ? 'Factura actualizada correctamente' : 'Factura creada correctamente');
      this.router.navigate(['/billing/invoices', inv.id]);
    },
  }));

  constructor() {
    afterNextRender(() => document.getElementById('customerName')?.focus());
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) this.model.set({
          customerName: data.customerName ?? '',
          customerVat: data.customerVat ?? '',
          customerAddress: data.customerAddress ?? '',
          notes: data.notes ?? '',
        });
      });
    }
  }

  save() {
    if (this.form().invalid()) return;
    if (this.isEdit) {
      const m = this.model();
      this.saveMutation.mutate({
        customerName: m.customerName || undefined,
        customerVat: m.customerVat || undefined,
        customerAddress: m.customerAddress || undefined,
        notes: m.notes || undefined,
      });
    } else {
      const m = this.model();
      this.saveMutation.mutate({
        customerName: m.customerName || undefined,
        customerVat: m.customerVat || undefined,
      });
    }
  }
}

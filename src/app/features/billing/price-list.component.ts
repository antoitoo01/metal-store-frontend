import { Component, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingService } from './billing.service';
import { PriceResponse, UpsertPriceRequest, Page } from '../../core/models/api.types';

@Component({
  selector: 'app-price-list',
  imports: [ReactiveFormsModule],
  template: `
    <div>
      <details class="mb-6 rounded-lg border">
        <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50">Nuevo precio</summary>
        <div class="border-t px-4 py-3">
          <form [formGroup]="priceForm" (ngSubmit)="createPrice()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-gray-600">Profile ID</label>
                <input formControlName="profileId" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm text-gray-600">Item ID</label>
                <input formControlName="itemId" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm text-gray-600">Precio unitario *</label>
              <input type="number" step="0.01" formControlName="unitPrice" required
                class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-sm text-gray-600">Válido desde</label>
                <input type="date" formControlName="validFrom" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
              <div>
                <label class="block text-sm text-gray-600">Válido hasta</label>
                <input type="date" formControlName="validTo" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <label class="block text-sm text-gray-600">Notas</label>
              <input formControlName="notes" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <button type="submit" [disabled]="!priceForm.value.unitPrice || createMutation.isPending()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
              {{ createMutation.isPending() ? '…' : 'Crear precio' }}
            </button>
          </form>
        </div>
      </details>

      @if (query.isPending()) {
        <p class="text-gray-500">Cargando…</p>
      } @else {
        <table class="w-full text-left text-sm">
          <thead>
            <tr class="border-b text-gray-600">
              <th class="py-2 pr-4 font-medium">Profile ID</th>
              <th class="py-2 pr-4 font-medium">Item ID</th>
              <th class="py-2 pr-4 font-medium">Precio</th>
              <th class="py-2 pr-4 font-medium">Válido desde</th>
              <th class="py-2 pr-4 font-medium">Válido hasta</th>
              <th class="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            @for (p of query.data()?.content; track p.id) {
              <tr class="border-b hover:bg-gray-50">
                <td class="py-2 pr-4 text-gray-600 font-mono text-xs">{{ p.profileId ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600 font-mono text-xs">{{ p.itemId ?? '—' }}</td>
                <td class="py-2 pr-4 font-medium text-gray-900">{{ p.unitPrice.toFixed(2) }} €</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.validFrom ?? '—' }}</td>
                <td class="py-2 pr-4 text-gray-600">{{ p.validTo ?? '—' }}</td>
                <td class="py-2">
                  <button (click)="deletePrice(p.id)" [disabled]="deleteMutation.isPending()"
                    class="text-sm text-red-600 hover:text-red-800 disabled:opacity-50">Eliminar</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      }
    </div>
  `,
})
export class PriceListComponent {
  private readonly billing = inject(BillingService);
  private readonly queryClient = inject(QueryClient);
  private readonly fb = inject(FormBuilder);

  readonly priceForm = this.fb.group({
    profileId: [''],
    itemId: [''],
    unitPrice: [0, Validators.required],
    validFrom: [''],
    validTo: [''],
    notes: [''],
  });

  readonly query = injectQuery<Page<PriceResponse>>(() => ({
    queryKey: ['prices'],
    queryFn: () => firstValueFrom(this.billing.prices()),
  }));

  readonly createMutation = injectMutation<PriceResponse, Error, UpsertPriceRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.billing.createPrice(body)),
    onSuccess: () => {
      this.queryClient.invalidateQueries({ queryKey: ['prices'] });
      this.priceForm.reset({ unitPrice: 0 });
    },
  }));

  readonly deleteMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.billing.deletePrice(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['prices'] }),
  }));

  createPrice() {
    const raw = this.priceForm.value;
    this.createMutation.mutate({
      profileId: raw.profileId || undefined,
      itemId: raw.itemId || undefined,
      unitPrice: raw.unitPrice!,
      validFrom: raw.validFrom || undefined,
      validTo: raw.validTo || undefined,
      notes: raw.notes || undefined,
    } as UpsertPriceRequest);
  }

  deletePrice(id: string) {
    this.deleteMutation.mutate(id);
  }
}

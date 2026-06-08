import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { BillingService } from './billing.service';
import { PriceResponse, UpsertPriceRequest, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-price-list',
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, DataStateComponent, TableComponent, SearchInputComponent, ConfirmDialogComponent],
  template: `
    <div>
      <details class="mb-6 rounded-lg border dark:border-gray-700">
        <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">Nuevo precio</summary>
        <div class="border-t px-4 py-3 dark:border-gray-700">
          <form [formGroup]="priceForm" (ngSubmit)="createPrice()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <app-input formControlName="profileId" label="Profile ID" />
              <app-input formControlName="itemId" label="Item ID" />
            </div>
            <app-input formControlName="unitPrice" label="Precio unitario *" type="number" />
            <div class="grid grid-cols-2 gap-3">
              <app-input formControlName="validFrom" label="Válido desde" type="date" />
              <app-input formControlName="validTo" label="Válido hasta" type="date" />
            </div>
            <app-input formControlName="notes" label="Notas" />
            <app-button type="submit" [disabled]="!priceForm.value.unitPrice || createMutation.isPending()">
              {{ createMutation.isPending() ? '…' : 'Crear precio' }}
            </app-button>
          </form>
        </div>
      </details>

      <div class="mt-4">
        <app-search-input placeholder="Buscar precio…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Profile ID', 'Item ID', 'Precio', 'Válido desde', 'Válido hasta', '']">
          @for (p of filtered(); track p.id) {
            <tr>
          <td class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ p.profileId ?? '—' }}</td>
          <td class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ p.itemId ?? '—' }}</td>
          <td class="font-medium text-gray-900 dark:text-white">{{ p.unitPrice.toFixed(2) }} €</td>
          <td class="text-gray-600 dark:text-gray-400">{{ p.validFrom ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ p.validTo ?? '—' }}</td>
              <td>
                <app-button variant="ghost" size="sm" (clicked)="confirmDelete(p.id)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
              </td>
            </tr>
          }
        </app-table>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showDeleteDialog()"
        title="Eliminar precio"
        message="¿Estás seguro de que querés eliminar este precio? Esta acción no se puede deshacer."
        variant="danger"
        (confirmed)="executeDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class PriceListComponent {
  private readonly billing = inject(BillingService);
  readonly q = signal('');
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

  readonly filtered = computed(() => {
    const data = this.query.data()?.content ?? [];
    const term = this.q().toLowerCase();
    if (!term) return data;
    return data.filter(
      (p) =>
        (p.profileId ?? '').toLowerCase().includes(term) ||
        (p.itemId ?? '').toLowerCase().includes(term) ||
        p.unitPrice.toString().includes(term),
    );
  });

  search(term: string) {
    this.q.set(term);
  }

  readonly createMutation = injectMutation<PriceResponse, Error, UpsertPriceRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.billing.createPrice(body)),
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['prices'] });
      this.priceForm.reset({ unitPrice: 0 });
    },
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<PriceResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.billing.deletePrice(id)),
    onMutate: (id) => optimisticRemoveFromPage<PriceResponse>(this.queryClient, ['prices'], id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, ['prices'], context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['prices'] }),
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

  readonly showDeleteDialog = signal(false);
  private deleteTarget = '';

  confirmDelete(id: string) {
    this.deleteTarget = id;
    this.showDeleteDialog.set(true);
  }

  executeDelete() {
    this.deleteMutation.mutate(this.deleteTarget);
    this.showDeleteDialog.set(false);
  }
}

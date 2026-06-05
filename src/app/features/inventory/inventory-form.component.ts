import { Component, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemRequest, InventoryItemResponse } from '../../core/models/api.types';

@Component({
  selector: 'app-inventory-form',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="p-6">
      <a routerLink="/inventory" class="text-sm text-blue-600 hover:underline">← Volver a inventario</a>

      <h1 class="mt-2 text-2xl font-bold text-gray-900">{{ isEdit ? 'Editar' : 'Nuevo' }} registro de inventario</h1>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <div>
          <label class="block text-sm font-medium text-gray-700">Cantidad *</label>
          <input type="number" formControlName="quantity" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Ubicación</label>
          <input formControlName="location" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <fieldset class="rounded-lg border p-4">
          <legend class="text-sm font-medium text-gray-700">Referencia (solo uno)</legend>
          <div class="mt-2 space-y-2">
            <div>
              <label class="block text-sm text-gray-600">Profile ID</label>
              <input formControlName="profileId" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
            <div>
              <label class="block text-sm text-gray-600">Item ID</label>
              <input formControlName="itemId" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
            </div>
          </div>
        </fieldset>

        <div>
          <label class="block text-sm font-medium text-gray-700">Coste (€)</label>
          <input type="number" step="0.01" formControlName="costPriceEur" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Proveedor</label>
          <input formControlName="supplier" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>

        <div>
          <label class="block text-sm font-medium text-gray-700">Notas</label>
          <textarea formControlName="notes" rows="3" class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"></textarea>
        </div>

        <button type="submit" [disabled]="form.invalid || saveMutation.isPending()"
          class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {{ saveMutation.isPending() ? 'Guardando…' : 'Guardar' }}
        </button>
      </form>
    </div>
  `,
})
export class InventoryFormComponent {
  private readonly fb = inject(FormBuilder);
  private readonly inventory = inject(InventoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly form = this.fb.group({
    quantity: [0, [Validators.required, Validators.min(1)]],
    location: [''],
    profileId: [''],
    itemId: [''],
    costPriceEur: [null as number | null],
    supplier: [''],
    notes: [''],
  });

  readonly existing = injectQuery<InventoryItemResponse>(() => ({
    queryKey: ['inventory-item', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.inventory.get(this.id!)),
  }));

  readonly saveMutation = injectMutation<InventoryItemResponse, Error, CreateInventoryItemRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.isEdit ? this.inventory.update(this.id!, body) : this.inventory.create(body)),
    onSuccess: () => this.router.navigate(['/inventory']),
  }));

  constructor() {
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) this.form.patchValue(data);
      });
    }
  }

  save(): void {
    if (this.form.invalid) return;
    const raw = this.form.value;
    this.saveMutation.mutate({
      quantity: raw.quantity!,
      location: raw.location || undefined,
      profileId: raw.profileId || undefined,
      itemId: raw.itemId || undefined,
      costPriceEur: raw.costPriceEur ?? undefined,
      supplier: raw.supplier || undefined,
      notes: raw.notes || undefined,
    } as CreateInventoryItemRequest);
  }
}

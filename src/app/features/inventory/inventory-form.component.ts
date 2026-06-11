import { Component, inject, effect, computed } from '@angular/core';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required } from '@angular/forms/signals';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemRequest, InventoryItemResponse } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { CardComponent } from '../../shared/components/card/card.component';

interface InventoryFormData {
  quantity: number;
  location: string;
  profileId: string;
  itemId: string;
  costPriceEur: number | null;
  supplier: string;
  notes: string;
}

@Component({
  selector: 'app-inventory-form',
  imports: [FormField, ButtonComponent, InputComponent, BackLinkComponent, CardComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/inventory" label="Volver a inventario" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ isEdit ? 'Editar' : 'Nuevo' }} registro de inventario</h1>

      <form (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <app-input [formField]="form.quantity" label="Cantidad *" type="number" [error]="quantityError()" />
        <app-input [formField]="form.location" label="Ubicación" />

        <app-card>
          <div body class="space-y-2">
            <legend class="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia (solo uno)</legend>
            <app-input [formField]="form.profileId" label="Profile ID" />
            <app-input [formField]="form.itemId" label="Item ID" />
          </div>
        </app-card>

        <app-input [formField]="form.costPriceEur" label="Coste (€)" type="number" />
        <app-input [formField]="form.supplier" label="Proveedor" />
        <app-input [formField]="form.notes" label="Notas" variant="textarea" />

        <app-button type="submit" [disabled]="form().invalid() || saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Guardando…' : 'Guardar' }}
        </app-button>
      </form>
    </div>
  `,
})
export class InventoryFormComponent {
  private readonly inventory = inject(InventoryService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly model = signal<InventoryFormData>({
    quantity: 1,
    location: '',
    profileId: '',
    itemId: '',
    costPriceEur: null,
    supplier: '',
    notes: '',
  });

  readonly form = form(this.model, (f) => {
    required(f.quantity, { message: 'La cantidad es obligatoria' });
  });

  readonly quantityError = computed(() => {
    const field = this.form.quantity();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
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
        if (data) this.model.set({
          quantity: data.quantity,
          location: data.location ?? '',
          profileId: data.profileId ?? '',
          itemId: data.itemId ?? '',
          costPriceEur: data.costPriceEur,
          supplier: data.supplier ?? '',
          notes: data.notes ?? '',
        });
      });
    }
  }

  save(): void {
    if (this.form().invalid()) return;
    const m = this.model();
    this.saveMutation.mutate({
      quantity: m.quantity,
      location: m.location || undefined,
      profileId: m.profileId || undefined,
      itemId: m.itemId || undefined,
      costPriceEur: m.costPriceEur ?? undefined,
      supplier: m.supplier || undefined,
      notes: m.notes || undefined,
    } as CreateInventoryItemRequest);
  }
}

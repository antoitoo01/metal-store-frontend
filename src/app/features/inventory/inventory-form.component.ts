import { Component, inject, effect } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from './inventory.service';
import { CreateInventoryItemRequest, InventoryItemResponse } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { BackLinkComponent } from '../../shared/components/back-link.component';
import { CardComponent } from '../../shared/components/card.component';

@Component({
  selector: 'app-inventory-form',
  imports: [ReactiveFormsModule, ButtonComponent, InputComponent, BackLinkComponent, CardComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/inventory" label="Volver a inventario" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ isEdit ? 'Editar' : 'Nuevo' }} registro de inventario</h1>

      <form [formGroup]="form" (ngSubmit)="save()" class="mt-6 max-w-lg space-y-4">
        <app-input formControlName="quantity" label="Cantidad *" type="number" />
        <app-input formControlName="location" label="Ubicación" />

        <app-card>
          <div body class="space-y-2">
            <legend class="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia (solo uno)</legend>
            <app-input formControlName="profileId" label="Profile ID" />
            <app-input formControlName="itemId" label="Item ID" />
          </div>
        </app-card>

        <app-input formControlName="costPriceEur" label="Coste (€)" type="number" />

        <app-input formControlName="supplier" label="Proveedor" />

        <app-input formControlName="notes" label="Notas" variant="textarea" />

        <app-button type="submit" [disabled]="form.invalid || saveMutation.isPending()">
          {{ saveMutation.isPending() ? 'Guardando…' : 'Guardar' }}
        </app-button>
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

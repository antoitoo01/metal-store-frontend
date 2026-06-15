import { Component, inject, effect, computed } from '@angular/core';
import { signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required } from '@angular/forms/signals';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { InventoryService } from './inventory.service';
import { CatalogService } from '../catalog/catalog.service';
import { CreateInventoryItemRequest, InventoryItemResponse, CatalogProfile, CatalogItem, Page } from '../../core/models/api.types';
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

      <form (submit)="save($event)" class="mt-6 max-w-lg space-y-4">
        <app-input [formField]="form.quantity" label="Cantidad *" type="number" [error]="quantityError()" />
        <app-input [formField]="form.location" label="Ubicación" />

        <app-card>
          <div body class="space-y-2">
            <legend class="text-sm font-medium text-gray-700 dark:text-gray-300">Referencia (solo uno)</legend>

            <div class="relative">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Perfil</label>
              <input type="text" [value]="profileSearchText()" (input)="onProfileInput($any($event).target.value)" placeholder="Buscar perfil…" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500" />
              @if (showProfileResults()) {
                <div class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  @if (profileSearchQuery.isPending()) {
                    <div class="px-3 py-2 text-sm text-gray-500">Buscando…</div>
                  } @else {
                    @for (p of profileSearchQuery.data()?.content ?? []; track p.id) {
                      <button type="button" (click)="selectProfile(p)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                        {{ p.designation }}
                      </button>
                    }
                    @if ((profileSearchQuery.data()?.content?.length ?? 0) === 0) {
                      <div class="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                    }
                  }
                </div>
              }
              @if (model().profileId && !profileSearchText()) {
                <div class="mt-1 flex items-center gap-2">
                  <span class="text-xs text-gray-500">ID: {{ model().profileId }}</span>
                  <button type="button" (click)="clearProfile()" class="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                </div>
              }
            </div>

            <div class="relative">
              <label class="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">Insumo</label>
              <input type="text" [value]="itemSearchText()" (input)="onItemInput($any($event).target.value)" placeholder="Buscar insumo…" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500" />
              @if (showItemResults()) {
                <div class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                  @if (itemSearchQuery.isPending()) {
                    <div class="px-3 py-2 text-sm text-gray-500">Buscando…</div>
                  } @else {
                    @for (item of itemSearchQuery.data()?.content ?? []; track item.id) {
                      <button type="button" (click)="selectItem(item)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                        {{ item.designation }}
                      </button>
                    }
                    @if ((itemSearchQuery.data()?.content?.length ?? 0) === 0) {
                      <div class="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                    }
                  }
                </div>
              }
              @if (model().itemId && !itemSearchText()) {
                <div class="mt-1 flex items-center gap-2">
                  <span class="text-xs text-gray-500">ID: {{ model().itemId }}</span>
                  <button type="button" (click)="clearItem()" class="text-xs text-red-500 hover:text-red-700">Eliminar</button>
                </div>
              }
            </div>
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
  private readonly catalog = inject(CatalogService);
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

  readonly existingProfile = injectQuery<CatalogProfile>(() => ({
    queryKey: ['catalog-profile', this.existing.data()?.profileId ?? ''],
    enabled: (this.isEdit && !!this.existing.data()?.profileId) as boolean,
    queryFn: () => firstValueFrom(this.catalog.getProfile(this.existing.data()!.profileId!)),
  }));

  readonly existingItem = injectQuery<CatalogItem>(() => ({
    queryKey: ['catalog-item', this.existing.data()?.itemId ?? ''],
    enabled: (this.isEdit && !!this.existing.data()?.itemId) as boolean,
    queryFn: () => firstValueFrom(this.catalog.getItem(this.existing.data()!.itemId!)),
  }));

  readonly saveMutation = injectMutation<InventoryItemResponse, Error, CreateInventoryItemRequest>(() => ({
    mutationFn: (body) => firstValueFrom(this.isEdit ? this.inventory.update(this.id!, body) : this.inventory.create(body)),
    onSuccess: () => this.router.navigate(['/inventory']),
  }));

  readonly profileSearchText = signal('');
  readonly profileSearchDebounced = signal('');
  readonly showProfileResults = signal(false);

  readonly itemSearchText = signal('');
  readonly itemSearchDebounced = signal('');
  readonly showItemResults = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly profileSearchQuery = injectQuery<Page<CatalogProfile>>(() => ({
    queryKey: ['catalog-profile-search', this.profileSearchDebounced()],
    queryFn: () => firstValueFrom(this.catalog.searchProfiles(this.profileSearchDebounced())),
    enabled: this.profileSearchDebounced().length >= 2,
  }));

  readonly itemSearchQuery = injectQuery<Page<CatalogItem>>(() => ({
    queryKey: ['catalog-item-search', this.itemSearchDebounced()],
    queryFn: () => firstValueFrom(this.catalog.searchItems(this.itemSearchDebounced())),
    enabled: this.itemSearchDebounced().length >= 2,
  }));

  constructor() {
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) {
          this.model.set({
            quantity: data.quantity,
            location: data.location ?? '',
            profileId: data.profileId ?? '',
            itemId: data.itemId ?? '',
            costPriceEur: data.costPriceEur,
            supplier: data.supplier ?? '',
            notes: data.notes ?? '',
          });
        }
      });
      effect(() => {
        const p = this.existingProfile.data();
        if (p) this.profileSearchText.set(p.designation);
      });
      effect(() => {
        const i = this.existingItem.data();
        if (i) this.itemSearchText.set(i.designation);
      });
    }
  }

  onProfileInput(value: string) {
    this.profileSearchText.set(value);
    if (value === '') {
      this.model.set({ ...this.model(), profileId: '' });
    }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.profileSearchDebounced.set(value);
      this.showProfileResults.set(value.length >= 2);
    }, 300);
  }

  selectProfile(p: CatalogProfile) {
    this.model.set({ ...this.model(), profileId: p.id, itemId: '' });
    this.profileSearchText.set(p.designation);
    this.showProfileResults.set(false);
    this.profileSearchDebounced.set('');
    this.itemSearchText.set('');
  }

  clearProfile() {
    this.model.set({ ...this.model(), profileId: '' });
    this.profileSearchText.set('');
  }

  onItemInput(value: string) {
    this.itemSearchText.set(value);
    if (value === '') {
      this.model.set({ ...this.model(), itemId: '' });
    }
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.itemSearchDebounced.set(value);
      this.showItemResults.set(value.length >= 2);
    }, 300);
  }

  selectItem(item: CatalogItem) {
    this.model.set({ ...this.model(), itemId: item.id, profileId: '' });
    this.itemSearchText.set(item.designation);
    this.showItemResults.set(false);
    this.itemSearchDebounced.set('');
    this.profileSearchText.set('');
  }

  clearItem() {
    this.model.set({ ...this.model(), itemId: '' });
    this.itemSearchText.set('');
  }

  save(event: Event): void {
    event.preventDefault();
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

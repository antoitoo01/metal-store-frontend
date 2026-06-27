import { Component, inject, effect, afterNextRender } from '@angular/core';
import { signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom, Observable } from 'rxjs';
import { injectQuery, injectMutation } from '@tanstack/angular-query-experimental';
import { Router, ActivatedRoute } from '@angular/router';
import { PurchaseOrderService } from './purchase-order.service';
import { CatalogService } from '../catalog/catalog.service';
import { PurchaseOrderResponse, CreatePurchaseOrderRequest, CreatePurchaseOrderLineRequest, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { SearchResultItem } from '../../shared/components/order-lines/order-lines.component';

interface POFormData {
  supplierName: string;
  supplierVat: string;
  supplierAddress: string;
  expectedDate: string;
  notes: string;
}

interface LocalLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
  profileId?: string;
  itemId?: string;
}

interface LineFormModel {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

@Component({
  selector: 'app-purchase-order-form',
  imports: [FormField, ButtonComponent, BackLinkComponent, InputComponent, CardComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/purchase-orders" label="Volver a órdenes de compra" />

      <h1 class="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{{ isEdit ? 'Editar orden de compra' : 'Nueva orden de compra' }}</h1>

      <form (submit)="save($event, false)" class="mt-6 space-y-8">
        <section>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Datos generales</h2>
          <div class="mt-4 max-w-lg space-y-4">
            <app-input
              id="supplierName"
              [formField]="form.supplierName"
              label="Nombre del proveedor"
            />

            <app-input
              [formField]="form.supplierVat"
              label="CIF / NIF"
            />

            <app-input
              [formField]="form.supplierAddress"
              label="Dirección"
            />

            <app-input
              type="date"
              [formField]="form.expectedDate"
              label="Fecha prevista"
            />

            <app-input
              variant="textarea"
              [formField]="form.notes"
              label="Notas"
            />
          </div>
        </section>

        <section>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Líneas</h2>

          <div class="mt-4 overflow-hidden rounded-xl border shadow-sm dark:border-gray-700">
            <table class="w-full text-left text-sm">
              <thead class="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                <tr>
                  <th class="px-4 py-2 font-medium">#</th>
                  <th class="px-4 py-2 font-medium">Descripción</th>
                  <th class="px-4 py-2 font-medium">Cantidad</th>
                  <th class="px-4 py-2 font-medium">Precio ud.</th>
                  <th class="px-4 py-2 font-medium">IVA</th>
                  <th class="px-4 py-2 font-medium">Total</th>
                  <th class="px-4 py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody class="divide-y dark:divide-gray-700">
                @for (line of lines(); track line.id) {
                  <tr class="border-b border-gray-200 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800">
                    <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ line.lineNumber }}</td>
                    <td class="px-4 py-2 text-gray-900 dark:text-white">{{ line.description }}</td>
                    <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ line.quantity }}</td>
                    <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ line.unitPrice.toFixed(2) }} €</td>
                    <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ line.vatRate }}%</td>
                    <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ line.totalPrice.toFixed(2) }} €</td>
                    <td class="px-4 py-2">
                      <app-button variant="ghost" size="sm" (clicked)="removeLine(line.id)">Eliminar</app-button>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                      No hay líneas. Añade una línea a continuación.
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <app-card>
            <div body class="space-y-3">
              <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300">Añadir línea</h3>

              <div class="relative">
                <app-input [formField]="lineForm.description" label="Descripción *" (input)="onSearchInput($any($event).target.value)" />
                @if (showSearchResults()) {
                  <div class="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-600 dark:bg-gray-800">
                    @if (searchQuery.isPending()) {
                      <div class="px-3 py-2 text-sm text-gray-500">Buscando…</div>
                    } @else {
                      @for (item of searchQuery.data()?.content ?? []; track item.id) {
                        <button type="button" (click)="selectSearchResult(item)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
                          {{ item.designation }}
                        </button>
                      }
                      @if ((searchQuery.data()?.content?.length ?? 0) === 0) {
                        <div class="px-3 py-2 text-sm text-gray-500">Sin resultados</div>
                      }
                    }
                  </div>
                }
              </div>

              <div class="grid grid-cols-3 gap-3">
                <app-input type="number" [formField]="lineForm.quantity" label="Cantidad *" />
                <app-input type="number" [formField]="lineForm.unitPrice" label="Precio ud. *" step="0.01" />
                <app-input type="number" [formField]="lineForm.vatRate" label="IVA %" step="0.01" />
              </div>

              <app-button (clicked)="addLine()" [disabled]="!lineModel().description || !lineModel().quantity || !lineModel().unitPrice">
                Añadir línea
              </app-button>
            </div>
          </app-card>
        </section>

        <div class="flex gap-3">
          <app-button type="submit" [disabled]="saveMutation.isPending()">
            {{ saveMutation.isPending() ? 'Guardando…' : 'Guardar borrador' }}
          </app-button>
          @if (!isEdit) {
            <app-button type="button" variant="primary" (clicked)="save($event, true)" [disabled]="saveMutation.isPending()">
              {{ saveMutation.isPending() ? 'Guardando…' : 'Emitir OC' }}
            </app-button>
          }
        </div>
      </form>
    </div>
  `,
})
export class PurchaseOrderFormComponent {
  private readonly poService = inject(PurchaseOrderService);
  private readonly catalog = inject(CatalogService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly notification = inject(NotificationService);

  readonly id = this.route.snapshot.params['id'] as string | undefined;
  readonly isEdit = !!this.id;

  readonly model = signal<POFormData>({
    supplierName: '',
    supplierVat: '',
    supplierAddress: '',
    expectedDate: '',
    notes: '',
  });

  readonly form = form(this.model);
  readonly lines = signal<LocalLineItem[]>([]);

  readonly lineModel = signal<LineFormModel>({ description: '', quantity: 1, unitPrice: 0, vatRate: 21 });
  readonly lineForm = form(this.lineModel);

  readonly existing = injectQuery<PurchaseOrderResponse>(() => ({
    queryKey: ['purchase-order', this.id!],
    enabled: this.isEdit,
    queryFn: () => firstValueFrom(this.poService.get(this.id!)),
  }));

  readonly saveMutation = injectMutation<PurchaseOrderResponse, Error, { body: CreatePurchaseOrderRequest | Partial<POFormData>; emitir: boolean }>(() => ({
    mutationFn: async ({ body, emitir }) => {
      if (this.isEdit) {
        return firstValueFrom(this.poService.update(this.id!, body));
      }
      const created = await firstValueFrom(this.poService.create(body as CreatePurchaseOrderRequest));
      for (const line of this.lines()) {
        await firstValueFrom(this.poService.addLine(created.id, {
          lineNumber: line.lineNumber,
          description: line.description,
          quantity: line.quantity,
          unitPrice: line.unitPrice,
          vatRate: line.vatRate,
          profileId: line.profileId,
          itemId: line.itemId,
        } as CreatePurchaseOrderLineRequest));
      }
      if (emitir) {
        await firstValueFrom(this.poService.issue(created.id));
      }
      return created;
    },
    onSuccess: (po) => {
      this.notification.success(this.isEdit ? 'Orden de compra actualizada correctamente' : 'Orden de compra creada correctamente');
      this.router.navigate(['/purchase-orders', po.id]);
    },
  }));

  readonly searchText = signal('');
  readonly debouncedSearch = signal('');
  readonly showSearchResults = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly searchQuery = injectQuery<Page<SearchResultItem>>(() => ({
    queryKey: ['po-form-search', this.debouncedSearch()],
    queryFn: () => firstValueFrom(this.catalog.searchProfiles(this.debouncedSearch()) as Observable<Page<SearchResultItem>>),
    enabled: this.debouncedSearch().length >= 2,
  }));

  constructor() {
    afterNextRender(() => document.getElementById('supplierName')?.focus());
    if (this.isEdit) {
      effect(() => {
        const data = this.existing.data();
        if (data) {
          this.model.set({
            supplierName: data.supplierName ?? '',
            supplierVat: data.supplierVat ?? '',
            supplierAddress: data.supplierAddress ?? '',
            expectedDate: data.expectedDate ?? '',
            notes: data.notes ?? '',
          });
        }
      });
    }
  }

  onSearchInput(value: string) {
    this.searchText.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.debouncedSearch.set(this.searchText());
      this.showSearchResults.set(this.searchText().length >= 2);
    }, 300);
  }

  selectSearchResult(item: SearchResultItem) {
    this.lineModel.set({ description: item.designation, quantity: this.lineModel().quantity, unitPrice: this.lineModel().unitPrice, vatRate: this.lineModel().vatRate });
    this.searchText.set(item.designation);
    this.showSearchResults.set(false);
    this.debouncedSearch.set('');
  }

  addLine() {
    const m = this.lineModel();
    const nextNumber = this.lines().length + 1;
    this.lines.update(lines => [...lines, {
      id: `temp-${crypto.randomUUID()}`,
      lineNumber: nextNumber,
      description: m.description,
      quantity: m.quantity,
      unitPrice: m.unitPrice,
      vatRate: m.vatRate,
      totalPrice: m.quantity * m.unitPrice * (1 + m.vatRate / 100),
    }]);
    this.lineModel.set({ description: '', quantity: 1, unitPrice: 0, vatRate: 21 });
  }

  removeLine(lineId: string) {
    this.lines.update(lines => lines.filter(l => l.id !== lineId));
  }

  save(event: Event, emitir: boolean): void {
    event.preventDefault();
    if (this.form().invalid()) return;
    const m = this.model();
    if (this.isEdit) {
      this.saveMutation.mutate({
        body: {
          supplierName: m.supplierName || undefined,
          supplierVat: m.supplierVat || undefined,
          supplierAddress: m.supplierAddress || undefined,
          expectedDate: m.expectedDate || undefined,
          notes: m.notes || undefined,
        },
        emitir: false,
      });
    } else {
      this.saveMutation.mutate({
        body: {
          supplierName: m.supplierName || undefined,
          supplierVat: m.supplierVat || undefined,
          supplierAddress: m.supplierAddress || undefined,
          expectedDate: m.expectedDate || undefined,
          notes: m.notes || undefined,
        } as CreatePurchaseOrderRequest,
        emitir,
      });
    }
  }
}

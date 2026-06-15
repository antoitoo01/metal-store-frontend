import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { form, FormField } from '@angular/forms/signals';
import { BillingService } from './billing.service';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';
import { PriceResponse, UpsertPriceRequest, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

interface PriceFormData {
  profileId: string;
  itemId: string;
  unitPrice: number;
  validFrom: string;
  validTo: string;
  notes: string;
}

@Component({
  selector: 'app-price-list',
  imports: [FormField, ButtonComponent, InputComponent, DataStateComponent, TableComponent, SearchInputComponent, PaginationComponent, ConfirmDialogComponent],
  template: `
    <div>
      <details class="mb-6 rounded-lg border dark:border-gray-700">
        <summary class="cursor-pointer px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800">
          {{ editingId() ? 'Editar precio' : 'Nuevo precio' }}
        </summary>
        <div class="border-t px-4 py-3 dark:border-gray-700">
          <form (submit)="savePrice($event)" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <app-input [formField]="priceForm.profileId" label="Profile ID" />
              <app-input [formField]="priceForm.itemId" label="Item ID" />
            </div>
            <app-input [formField]="priceForm.unitPrice" label="Precio unitario *" type="number" />
            <div class="grid grid-cols-2 gap-3">
              <app-input [formField]="priceForm.validFrom" label="Válido desde" type="date" />
              <app-input [formField]="priceForm.validTo" label="Válido hasta" type="date" />
            </div>
            <app-input [formField]="priceForm.notes" label="Notas" />
            <div class="flex gap-2">
              <app-button type="submit" [disabled]="!priceModel().unitPrice || mutation.isPending()">
                {{ mutation.isPending() ? '…' : editingId() ? 'Guardar cambios' : 'Crear precio' }}
              </app-button>
              @if (editingId()) {
                <app-button variant="ghost" type="button" (clicked)="cancelEdit()">Cancelar</app-button>
              }
            </div>
          </form>
        </div>
      </details>

      <div class="mt-4">
        <app-search-input placeholder="Buscar precio…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [empty]="query.data()?.content?.length === 0" [skeleton]="true" (retry)="query.refetch()">
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (p of query.data()?.content ?? []; track p.id) {
            <tr>
          <td class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ p.profileId ?? '—' }}</td>
          <td class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ p.itemId ?? '—' }}</td>
          <td class="font-medium text-gray-900 dark:text-white">{{ p.unitPrice.toFixed(2) }} €</td>
          <td class="text-gray-600 dark:text-gray-400">{{ p.validFrom ?? '—' }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ p.validTo ?? '—' }}</td>
              <td>
                <app-button variant="ghost" size="sm" (clicked)="editPrice(p)" [disabled]="mutation.isPending()">Editar</app-button>
                <app-button variant="ghost" size="sm" (clicked)="confirmDelete(p.id)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
              </td>
            </tr>
          }
        </app-table>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
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
  readonly columnDefs: ColumnDef[] = [
    { key: 'profileId', label: 'Profile ID', sortable: true },
    { key: 'itemId', label: 'Item ID', sortable: true },
    { key: 'unitPrice', label: 'Precio', sortable: true },
    { key: 'validFrom', label: 'Válido desde', sortable: true },
    { key: 'validTo', label: 'Válido hasta', sortable: true },
    { key: 'actions', label: '' },
  ];

  private readonly billing = inject(BillingService);
  private readonly notification = inject(NotificationService);
  private readonly queryClient = inject(QueryClient);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  readonly priceModel = signal<PriceFormData>({
    profileId: '',
    itemId: '',
    unitPrice: 0,
    validFrom: '',
    validTo: '',
    notes: '',
  });

  readonly priceForm = form(this.priceModel);

  readonly queryKey = computed(() => ['prices', { page: this.page(), size: this.size, q: this.q() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }] as unknown[]);

  readonly query = injectQuery<Page<PriceResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => firstValueFrom(this.billing.prices(this.page(), this.size, this.q() || undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
  }));

  search(term: string) {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number) {
    this.page.set(p);
  }

  onSortChange(sort: SortChange): void {
    this.sortBy.set(sort.column);
    this.sortDir.set(sort.direction);
    this.page.set(0);
  }

  readonly editingId = signal<string | null>(null);

  readonly mutation = injectMutation<PriceResponse, Error, UpsertPriceRequest | { id: string; body: Partial<PriceFormData> }>(() => ({
    mutationFn: (data) => {
      if ('id' in data) {
        return firstValueFrom(this.billing.updatePrice(data.id, {
          unitPrice: data.body.unitPrice || undefined,
          validFrom: data.body.validFrom || null,
          validTo: data.body.validTo || null,
          notes: data.body.notes || null,
        }));
      }
      return firstValueFrom(this.billing.createPrice(data));
    },
    onSuccess: () => this.notification.success(this.editingId() ? 'Precio actualizado correctamente' : 'Precio creado correctamente'),
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['prices'] });
      this.resetForm();
    },
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<PriceResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.billing.deletePrice(id)),
    onMutate: (id) => optimisticRemoveFromPage<PriceResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Precio eliminado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['prices'] }),
  }));

  editPrice(p: PriceResponse) {
    this.editingId.set(p.id);
    this.priceModel.set({
      profileId: p.profileId ?? '',
      itemId: p.itemId ?? '',
      unitPrice: p.unitPrice,
      validFrom: p.validFrom ?? '',
      validTo: p.validTo ?? '',
      notes: p.notes ?? '',
    });
  }

  cancelEdit() {
    this.resetForm();
  }

  savePrice(event: Event) {
    event.preventDefault();
    const m = this.priceModel();
    const editing = this.editingId();
    if (editing) {
      this.mutation.mutate({ id: editing, body: m });
    } else {
      this.mutation.mutate({
        profileId: m.profileId || undefined,
        itemId: m.itemId || undefined,
        unitPrice: m.unitPrice,
        validFrom: m.validFrom || undefined,
        validTo: m.validTo || undefined,
        notes: m.notes || undefined,
      } as UpsertPriceRequest);
    }
  }

  private resetForm() {
    this.editingId.set(null);
    this.priceModel.set({ profileId: '', itemId: '', unitPrice: 0, validFrom: '', validTo: '', notes: '' });
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

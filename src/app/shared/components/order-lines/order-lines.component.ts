import { Component, inject, input, signal } from '@angular/core';
import { form, FormField } from '@angular/forms/signals';
import { firstValueFrom, Observable } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { Page } from '../../../core/models/api.types';
import { NotificationService } from '../../../core/services/notification.service';
import { optimisticAddToArray, optimisticRemoveFromArray, rollbackArray } from '../../../core/services/optimistic-utils';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';
import { TableComponent } from '../table/table.component';
import { CardComponent } from '../card/card.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ColumnDef } from '../table/column-def.type';

export interface OrderLineItem {
  id: string;
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  totalPrice: number;
}

export interface CreateOrderLineItem {
  lineNumber: number;
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
  profileId?: string;
  itemId?: string;
}

export interface SearchResultItem {
  id: string;
  designation: string;
}

interface LineFormModel {
  description: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}

@Component({
  selector: 'app-order-lines',
  imports: [FormField, InputComponent, ButtonComponent, TableComponent, CardComponent, ConfirmDialogComponent],
  template: `
    <app-table [columns]="columns()">
      @for (line of lines(); track line.id) {
        <tr>
          <td class="text-gray-600 dark:text-gray-400">{{ line.lineNumber }}</td>
          <td class="text-gray-900 dark:text-white">{{ line.description }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ line.quantity }}</td>
          <td class="text-gray-600 dark:text-gray-400">{{ line.unitPrice.toFixed(2) }} €</td>
          <td class="text-gray-600 dark:text-gray-400">{{ line.vatRate }}%</td>
          <td class="font-medium text-gray-900 dark:text-white">{{ line.totalPrice.toFixed(2) }} €</td>
          <td>
            @if (canEdit()) {
              <app-button variant="ghost" size="sm" (clicked)="confirmRemove(line.id)" [disabled]="deleteLineMutation.isPending()">Eliminar</app-button>
            }
          </td>
        </tr>
      }
    </app-table>

    @if (canEdit()) {
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
                    <button type="button" (click)="selectResult(item)" class="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white">
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

          <app-button (clicked)="addLine()" [disabled]="!lineModel().description || !lineModel().quantity || !lineModel().unitPrice || addLineMutation.isPending()">
            {{ addLineMutation.isPending() ? 'Añadiendo…' : 'Añadir línea' }}
          </app-button>
        </div>
      </app-card>
    }

    <app-confirm-dialog
      [visible]="showDeleteDialog()"
      title="Eliminar línea"
      message="¿Estás seguro de que querés eliminar esta línea?"
      variant="danger"
      (confirmed)="executeRemoveLine()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class OrderLinesComponent {
  private readonly queryClient = inject(QueryClient);
  private readonly notification = inject(NotificationService);

  readonly entityId = input.required<string>();
  readonly lines = input.required<OrderLineItem[]>();
  readonly columns = input.required<ColumnDef[]>();
  readonly canEdit = input.required<boolean>();

  readonly addLineFn = input.required<(body: CreateOrderLineItem) => Observable<OrderLineItem>>();
  readonly removeLineFn = input.required<(lineId: string) => Observable<void>>();
  readonly searchFn = input.required<(q: string) => Observable<Page<SearchResultItem>>>();
  readonly onSelectResult = input.required<(item: SearchResultItem) => CreateOrderLineItem>();
  readonly invalidateKeys = input.required<string[][]>();
  readonly queryKey = input.required<string[]>();

  readonly lineModel = signal<LineFormModel>({ description: '', quantity: 1, unitPrice: 0, vatRate: 21 });

  readonly lineForm = form(this.lineModel);

  readonly addLineMutation = injectMutation<OrderLineItem, Error, CreateOrderLineItem, OrderLineItem[] | undefined>(() => ({
    mutationFn: (body) => firstValueFrom(this.addLineFn()(body)),
    onMutate: (body) => {
      const temp: OrderLineItem = {
        id: `temp-${crypto.randomUUID()}`,
        lineNumber: body.lineNumber,
        description: body.description,
        quantity: body.quantity,
        unitPrice: body.unitPrice,
        vatRate: body.vatRate,
        totalPrice: body.quantity * body.unitPrice * (1 + body.vatRate / 100),
      };
      return optimisticAddToArray(this.queryClient, this.queryKey(), temp);
    },
    onError: (_err, _body, context) => {
      if (context) rollbackArray(this.queryClient, this.queryKey(), context);
    },
    onSuccess: () => this.notification.success('Línea añadida correctamente'),
    onSettled: () => {
      for (const key of this.invalidateKeys()) {
        this.queryClient.invalidateQueries({ queryKey: key });
      }
      this.lineModel.set({ description: '', quantity: 1, unitPrice: 0, vatRate: 21 });
    },
  }));

  readonly deleteLineMutation = injectMutation<void, Error, string, OrderLineItem[] | undefined>(() => ({
    mutationFn: (lineId) => firstValueFrom(this.removeLineFn()(lineId)),
    onMutate: (lineId) => optimisticRemoveFromArray<OrderLineItem>(this.queryClient, this.queryKey(), lineId),
    onError: (_err, _lineId, context) => {
      if (context) rollbackArray(this.queryClient, this.queryKey(), context);
    },
    onSuccess: () => this.notification.success('Línea eliminada correctamente'),
    onSettled: () => {
      for (const key of this.invalidateKeys()) {
        this.queryClient.invalidateQueries({ queryKey: key });
      }
    },
  }));

  readonly searchText = signal('');
  readonly debouncedSearch = signal('');
  readonly showSearchResults = signal(false);

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  readonly searchQuery = injectQuery<Page<SearchResultItem>>(() => ({
    queryKey: ['order-lines-search', this.debouncedSearch()],
    queryFn: () => firstValueFrom(this.searchFn()(this.debouncedSearch())),
    enabled: this.debouncedSearch().length >= 2,
  }));

  readonly showDeleteDialog = signal(false);
  private deleteTarget = '';

  onSearchInput(value: string) {
    this.searchText.set(value);
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.debouncedSearch.set(this.searchText());
      this.showSearchResults.set(this.searchText().length >= 2);
    }, 300);
  }

  selectResult(item: SearchResultItem) {
    const update = this.onSelectResult()(item);
    this.lineModel.set({ description: update.description, quantity: this.lineModel().quantity, unitPrice: this.lineModel().unitPrice, vatRate: this.lineModel().vatRate });
    this.searchText.set(item.designation);
    this.showSearchResults.set(false);
    this.debouncedSearch.set('');
  }

  addLine() {
    const nextNumber = (this.lines()?.length ?? 0) + 1;
    this.addLineMutation.mutate({ ...this.lineModel(), lineNumber: nextNumber } as CreateOrderLineItem);
  }

  confirmRemove(lineId: string) {
    this.deleteTarget = lineId;
    this.showDeleteDialog.set(true);
  }

  executeRemoveLine() {
    this.deleteLineMutation.mutate(this.deleteTarget);
    this.showDeleteDialog.set(false);
  }
}

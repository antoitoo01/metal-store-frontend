import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { FormsModule } from '@angular/forms';
import { CatalogService } from './catalog.service';
import { TypeResponse, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';

@Component({
  selector: 'app-catalog-item-types',
  imports: [FormsModule, ButtonComponent, InputComponent, DataStateComponent, TableComponent, ConfirmDialogComponent],
  template: `
    <div>
      <div class="flex items-center gap-2">
        <app-input [(ngModel)]="newName" placeholder="Nuevo tipo…" [ngModelOptions]="{standalone: true}" />
        <app-button (clicked)="createType()" [disabled]="!newName() || createMutation.isPending()">
          {{ createMutation.isPending() ? '…' : 'Crear' }}
        </app-button>
      </div>

      <app-data-state [loading]="query.isPending()" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Nombre', 'Acciones']">
          @for (t of query.data()?.content; track t.id) {
            <tr>
              <td class="text-gray-900 dark:text-white">{{ t.name }}</td>
              <td>
                <app-button variant="ghost" size="sm" (clicked)="confirmDelete(t.id)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
              </td>
            </tr>
          }
        </app-table>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showDeleteDialog()"
        title="Eliminar tipo"
        message="¿Estás seguro de que querés eliminar este tipo de ítem? Esta acción no se puede deshacer."
        variant="danger"
        (confirmed)="executeDelete()"
        (cancelled)="showDeleteDialog.set(false)" />
    </div>
  `,
})
export class CatalogItemTypesComponent {
  private readonly catalog = inject(CatalogService);
  private readonly queryClient = inject(QueryClient);

  readonly newName = signal('');

  readonly query = injectQuery<Page<TypeResponse>>(() => ({
    queryKey: ['catalog-item-types'],
    queryFn: () => firstValueFrom(this.catalog.itemTypes()),
  }));

  readonly createMutation = injectMutation<TypeResponse, Error, string>(() => ({
    mutationFn: (name) => firstValueFrom(this.catalog.createItemType({ name })),
    onSettled: () => { this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }); this.newName.set(''); },
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<TypeResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.catalog.deleteItemType(id)),
    onMutate: (id) => optimisticRemoveFromPage<TypeResponse>(this.queryClient, ['catalog-item-types'], id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, ['catalog-item-types'], context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }),
  }));

  createType() {
    if (!this.newName().trim()) return;
    this.createMutation.mutate(this.newName().trim());
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

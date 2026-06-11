import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { form, FormField } from '@angular/forms/signals';
import { CatalogService } from './catalog.service';
import { ColumnDef } from '../../shared/components/table/column-def.type';
import { TypeResponse, Page } from '../../core/models/api.types';
import { NotificationService } from '../../core/services/notification.service';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-catalog-item-types',
  imports: [FormField, ButtonComponent, DataStateComponent, TableComponent, ConfirmDialogComponent],
  template: `
    <div>
      <form (ngSubmit)="createType()" class="flex items-center gap-2">
        <input
          [formField]="form.newName"
          placeholder="Nuevo tipo…"
          class="block w-full max-w-xs rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600"
        />
        <app-button type="submit" [disabled]="!model().newName.trim() || createMutation.isPending()">
          {{ createMutation.isPending() ? '…' : 'Crear' }}
        </app-button>
      </form>

      <app-data-state [loading]="query.isPending()" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="columnDefs">
          @for (t of query.data()?.content; track t.id) {
            <tr>
              <td>
                <button (click)="editType(t)" class="text-left text-gray-900 hover:text-primary-600 dark:text-white dark:hover:text-primary-400 underline decoration-dotted underline-offset-2">
                  {{ t.name }}
                </button>
              </td>
              <td>
                <app-button variant="ghost" size="sm" (clicked)="confirmDelete(t.id)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
              </td>
            </tr>
          }
        </app-table>
      </app-data-state>

      @if (showEditDialog()) {
        <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50" (click)="closeEdit()">
          <div class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800" (click)="$event.stopPropagation()">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Editar tipo</h3>
            <div class="mt-4">
              <input
                [formField]="editForm.name"
                class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500 dark:border-gray-600"
              />
            </div>
            <div class="mt-6 flex justify-end gap-3">
              <app-button variant="ghost" (clicked)="closeEdit()">Cancelar</app-button>
              <app-button (clicked)="saveEdit()" [disabled]="!editModel().name.trim() || updateMutation.isPending()">
                {{ updateMutation.isPending() ? '…' : 'Guardar' }}
              </app-button>
            </div>
          </div>
        </div>
      }

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
  readonly columnDefs: ColumnDef[] = [
    { key: 'name', label: 'Nombre' },
    { key: 'actions', label: 'Acciones' },
  ];

  private readonly catalog = inject(CatalogService);
  private readonly notification = inject(NotificationService);
  private readonly queryClient = inject(QueryClient);

  readonly model = signal({ newName: '' });
  readonly form = form(this.model);

  readonly query = injectQuery<Page<TypeResponse>>(() => ({
    queryKey: ['catalog-item-types'],
    queryFn: () => firstValueFrom(this.catalog.itemTypes()),
  }));

  readonly createMutation = injectMutation<TypeResponse, Error, string>(() => ({
    mutationFn: (name) => firstValueFrom(this.catalog.createItemType({ name })),
    onSuccess: () => this.notification.success('Tipo creado correctamente'),
    onSettled: () => { this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }); this.model.set({ newName: '' }); },
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<TypeResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.catalog.deleteItemType(id)),
    onMutate: (id) => optimisticRemoveFromPage<TypeResponse>(this.queryClient, ['catalog-item-types'], id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, ['catalog-item-types'], context); },
    onSuccess: () => this.notification.success('Tipo eliminado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] }),
  }));

  readonly updateMutation = injectMutation<TypeResponse, Error, { id: string; name: string }>(() => ({
    mutationFn: ({ id, name }) => firstValueFrom(this.catalog.updateItemType(id, { name })),
    onSuccess: () => this.notification.success('Tipo actualizado correctamente'),
    onSettled: () => {
      this.queryClient.invalidateQueries({ queryKey: ['catalog-item-types'] });
      this.closeEdit();
    },
  }));

  createType() {
    const name = this.model().newName.trim();
    if (!name) return;
    this.createMutation.mutate(name);
  }

  readonly showEditDialog = signal(false);
  readonly editModel = signal({ name: '' });
  readonly editForm = form(this.editModel);
  private editTarget = '';

  editType(t: TypeResponse) {
    this.editTarget = t.id;
    this.editModel.set({ name: t.name });
    this.showEditDialog.set(true);
  }

  closeEdit() {
    this.showEditDialog.set(false);
    this.editTarget = '';
  }

  saveEdit() {
    const name = this.editModel().name.trim();
    if (!name || !this.editTarget) return;
    this.updateMutation.mutate({ id: this.editTarget, name });
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

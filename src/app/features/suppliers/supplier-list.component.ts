import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { form, FormField, required, email } from '@angular/forms/signals';
import { injectQuery, injectMutation, QueryClient, keepPreviousData } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { SupplierService } from './supplier.service';
import { SupplierResponse, CreateSupplierRequest, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, optimisticUpdateInPage, rollbackPage } from '../../core/services/optimistic-utils';
import { exportCsv } from '../../core/services/csv-export';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { CardComponent } from '../../shared/components/card/card.component';
import { InputComponent } from '../../shared/components/input/input.component';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';

interface SupplierFormData {
  name: string;
  email: string;
  phone: string;
  address: string;
  vatNumber: string;
  notes: string;
}

const EMPTY_FORM: SupplierFormData = { name: '', email: '', phone: '', address: '', vatNumber: '', notes: '' };

@Component({
  selector: 'app-supplier-list',
  imports: [
    RouterLink, ButtonComponent, PaginationComponent, StatusBadgeComponent,
    DataStateComponent, TableComponent, SearchInputComponent, ConfirmDialogComponent,
    CardComponent, InputComponent, FormField,
  ],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Proveedores</h1>
        <app-button (clicked)="openNew()">Nuevo proveedor</app-button>
      </div>

      @if (showForm()) {
        <app-card>
          <div body>
            <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">
              {{ editingSupplier() ? 'Editar proveedor' : 'Nuevo proveedor' }}
            </h2>
            <form (submit)="save($event)" class="max-w-lg space-y-4">
              <app-input [formField]="supplierForm.name" label="Nombre *" placeholder="Nombre del proveedor" [error]="nameError()" />
              <app-input type="email" [formField]="supplierForm.email" label="Email" placeholder="email@ejemplo.com" [error]="emailError()" />
              <app-input [formField]="supplierForm.phone" label="Teléfono" placeholder="+34 600 000 000" />
              <app-input [formField]="supplierForm.address" label="Dirección" placeholder="Calle, ciudad, etc." />
              <app-input [formField]="supplierForm.vatNumber" label="CIF / NIF" placeholder="B-12345678" />
              <app-input variant="textarea" [formField]="supplierForm.notes" label="Notas" placeholder="Notas adicionales…" />
              <div class="flex items-center gap-3">
                <app-button type="submit" [disabled]="supplierForm().invalid() || saveMutation.isPending()">
                  {{ saveMutation.isPending() ? 'Guardando…' : 'Guardar' }}
                </app-button>
                <app-button variant="ghost" type="button" (clicked)="cancelForm()">Cancelar</app-button>
              </div>
            </form>
          </div>
        </app-card>
      }

      <div class="mt-4 flex flex-wrap items-center gap-3">
        <app-search-input placeholder="Buscar por nombre…" (searchChange)="search($event)" />
        <div class="flex items-center gap-2">
          <label class="text-sm text-gray-600 dark:text-gray-400">Estado:</label>
          <select
            (change)="setStatusFilter($any($event.target).value)"
            class="rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-600 dark:bg-slate-800 dark:text-white"
          >
            <option value="">Todos</option>
            <option value="ACTIVE">Activo</option>
            <option value="INACTIVE">Inactivo</option>
          </select>
        </div>
        <app-button variant="secondary" size="sm" (clicked)="exportToCsv()" [disabled]="filteredSuppliers().length === 0">Exportar CSV</app-button>
      </div>

      <app-data-state
        [loading]="query.isLoading()"
        [error]="query.isError() ? 'Error al cargar proveedores' : undefined"
        [empty]="filteredSuppliers().length === 0"
        emptyMessage="No hay proveedores que coincidan con los filtros."
        [skeleton]="true"
        (retry)="query.refetch()"
      >
        <app-table [columns]="columnDefs" [sortBy]="sortBy()" [sortDir]="sortDir()" (sortChange)="onSortChange($event)">
          @for (supplier of filteredSuppliers(); track supplier.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">
                <a [routerLink]="['/suppliers', supplier.id]" class="hover:text-blue-600 dark:hover:text-blue-400">{{ supplier.name }}</a>
              </td>
              <td class="text-gray-600 dark:text-gray-400">{{ supplier.email ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ supplier.phone ?? '—' }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ supplier.vatNumber ?? '—' }}</td>
              <td>
                <app-status-badge [status]="supplier.status" [label]="supplier.status === 'ACTIVE' ? 'Activo' : 'Inactivo'" />
              </td>
              <td class="text-right">
                <div class="flex items-center justify-end gap-1">
                  <app-button variant="ghost" size="sm" (clicked)="openEdit(supplier)">Editar</app-button>
                  @if (supplier.status === 'ACTIVE') {
                    <app-button variant="ghost" size="sm" (clicked)="confirmDeactivate(supplier)">Desactivar</app-button>
                  } @else {
                    <app-button variant="ghost" size="sm" (clicked)="confirmActivate(supplier)">Activar</app-button>
                  }
                  <app-button variant="ghost" size="sm" (clicked)="confirmDelete(supplier)">Eliminar</app-button>
                </div>
              </td>
            </tr>
          }
        </app-table>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
      </app-data-state>
    </div>

    <app-confirm-dialog
      [visible]="showDeleteDialog()"
      title="Eliminar proveedor"
      [message]="'¿Estás seguro de que querés eliminar a ' + (deleteTarget?.name ?? '') + '? Esta acción no se puede deshacer.'"
      variant="danger"
      (confirmed)="executeDelete()"
      (cancelled)="showDeleteDialog.set(false)" />

    <app-confirm-dialog
      [visible]="showActivateDialog()"
      title="Activar proveedor"
      [message]="'¿Estás seguro de que querés activar a ' + (activateTarget?.name ?? '') + '?'"
      variant="default"
      confirmLabel="Activar"
      (confirmed)="executeActivate()"
      (cancelled)="showActivateDialog.set(false)" />

    <app-confirm-dialog
      [visible]="showDeactivateDialog()"
      title="Desactivar proveedor"
      [message]="'¿Estás seguro de que querés desactivar a ' + (deactivateTarget?.name ?? '') + '?'"
      variant="warning"
      confirmLabel="Desactivar"
      (confirmed)="executeDeactivate()"
      (cancelled)="showDeactivateDialog.set(false)" />
  `,
})
export class SupplierListComponent {
  private readonly supplierService = inject(SupplierService);
  private readonly queryClient = inject(QueryClient);
  private readonly notification = inject(NotificationService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly statusFilter = signal('');

  protected readonly filteredSuppliers = computed(() => {
    const data = this.query.data()?.content;
    if (!data) return [];
    const status = this.statusFilter();
    if (!status) return data;
    return data.filter((s) => s.status === status);
  });

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly columnDefs: ColumnDef[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'phone', label: 'Teléfono', sortable: true },
    { key: 'vatNumber', label: 'VAT', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: '', label: '' },
  ];

  readonly queryKey = computed(() => ['suppliers', { page: this.page(), size: this.size, q: this.q(), status: this.statusFilter() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }] as unknown[]);

  readonly query = injectQuery<Page<SupplierResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => firstValueFrom(this.supplierService.list(this.page(), this.size, this.q() || undefined, this.statusFilter() || undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  }));

  // ── Inline form ──

  readonly showForm = signal(false);
  readonly editingSupplier = signal<SupplierResponse | null>(null);

  readonly formModel = signal<SupplierFormData>({ ...EMPTY_FORM });

  readonly supplierForm = form(this.formModel, (f) => {
    required(f.name, { message: 'El nombre es obligatorio' });
    email(f.email, { message: 'Email inválido' });
  });

  readonly nameError = computed(() => {
    const field = this.supplierForm.name();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly emailError = computed(() => {
    const field = this.supplierForm.email();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly saveMutation = injectMutation<SupplierResponse, Error, CreateSupplierRequest>(() => ({
    mutationFn: (body) => firstValueFrom(
      this.editingSupplier()
        ? this.supplierService.update(this.editingSupplier()!.id, body)
        : this.supplierService.create(body),
    ),
    onSuccess: () => {
      this.notification.success(this.editingSupplier() ? 'Proveedor actualizado correctamente' : 'Proveedor creado correctamente');
      this.showForm.set(false);
      this.editingSupplier.set(null);
      this.queryClient.invalidateQueries({ queryKey: ['suppliers'] });
    },
  }));

  openNew() {
    this.editingSupplier.set(null);
    this.formModel.set({ ...EMPTY_FORM });
    this.supplierForm().reset();
    this.showForm.set(true);
  }

  openEdit(supplier: SupplierResponse) {
    this.editingSupplier.set(supplier);
    this.formModel.set({
      name: supplier.name,
      email: supplier.email ?? '',
      phone: supplier.phone ?? '',
      address: supplier.address ?? '',
      vatNumber: supplier.vatNumber ?? '',
      notes: supplier.notes ?? '',
    });
    this.supplierForm().reset();
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingSupplier.set(null);
  }

  save(event: Event): void {
    event.preventDefault();
    if (this.supplierForm().invalid()) return;
    this.saveMutation.mutate(this.formModel() as CreateSupplierRequest);
  }

  // ── Mutations ──

  readonly deleteMutation = injectMutation<void, Error, string, PageData<SupplierResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.supplierService.remove(id)),
    onMutate: (id) => optimisticRemoveFromPage<SupplierResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Proveedor eliminado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  }));

  readonly activateMutation = injectMutation<SupplierResponse, Error, string, PageData<SupplierResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.supplierService.activate(id)),
    onMutate: (id) => optimisticUpdateInPage<SupplierResponse>(this.queryClient, this.queryKey(), id, (s) => ({ ...s, status: 'ACTIVE' })),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Proveedor activado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  }));

  readonly deactivateMutation = injectMutation<SupplierResponse, Error, string, PageData<SupplierResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.supplierService.deactivate(id)),
    onMutate: (id) => optimisticUpdateInPage<SupplierResponse>(this.queryClient, this.queryKey(), id, (s) => ({ ...s, status: 'INACTIVE' })),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Proveedor desactivado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['suppliers'] }),
  }));

  search(term: string): void {
    this.q.set(term);
    this.page.set(0);
  }

  setStatusFilter(status: string): void {
    this.statusFilter.set(status);
    this.page.set(0);
  }

  onSortChange(sort: SortChange): void {
    this.sortBy.set(sort.column);
    this.sortDir.set(sort.direction);
    this.page.set(0);
  }

  goTo(p: number): void {
    this.page.set(p);
  }

  // ── Confirm dialogs ──

  readonly showDeleteDialog = signal(false);
  protected deleteTarget: SupplierResponse | null = null;

  readonly showActivateDialog = signal(false);
  protected activateTarget: SupplierResponse | null = null;

  readonly showDeactivateDialog = signal(false);
  protected deactivateTarget: SupplierResponse | null = null;

  confirmDelete(supplier: SupplierResponse) {
    this.deleteTarget = supplier;
    this.showDeleteDialog.set(true);
  }

  executeDelete() {
    if (this.deleteTarget) {
      this.deleteMutation.mutate(this.deleteTarget.id);
    }
    this.showDeleteDialog.set(false);
    this.deleteTarget = null;
  }

  confirmActivate(supplier: SupplierResponse) {
    this.activateTarget = supplier;
    this.showActivateDialog.set(true);
  }

  executeActivate() {
    if (this.activateTarget) {
      this.activateMutation.mutate(this.activateTarget.id);
    }
    this.showActivateDialog.set(false);
    this.activateTarget = null;
  }

  confirmDeactivate(supplier: SupplierResponse) {
    this.deactivateTarget = supplier;
    this.showDeactivateDialog.set(true);
  }

  executeDeactivate() {
    if (this.deactivateTarget) {
      this.deactivateMutation.mutate(this.deactivateTarget.id);
    }
    this.showDeactivateDialog.set(false);
    this.deactivateTarget = null;
  }

  protected exportToCsv(): void {
    const suppliers = this.filteredSuppliers();
    exportCsv('proveedores', ['Nombre', 'Email', 'Teléfono', 'VAT', 'Estado'], suppliers.map((s) => [
      s.name, s.email, s.phone, s.vatNumber, s.status === 'ACTIVE' ? 'Activo' : 'Inactivo',
    ]));
  }
}

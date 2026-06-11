import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { ClientResponse, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, optimisticUpdateInPage, rollbackPage } from '../../core/services/optimistic-utils';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { TableComponent } from '../../shared/components/table/table.component';
import { SearchInputComponent } from '../../shared/components/search-input/search-input.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { ColumnDef, SortChange } from '../../shared/components/table/column-def.type';

@Component({
  selector: 'app-client-list',
  imports: [RouterLink, ButtonComponent, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent, ConfirmDialogComponent],
  templateUrl: './client-list.html',
})
export class ClientListComponent {
  private readonly clientService = inject(ClientService);
  private readonly queryClient = inject(QueryClient);
  private readonly notification = inject(NotificationService);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;
  readonly statusFilter = signal('');

  protected readonly filteredClients = computed(() => {
    const data = this.query.data()?.content;
    if (!data) return [];
    const status = this.statusFilter();
    if (!status) return data;
    return data.filter(c => c.status === status);
  });

  readonly sortBy = signal('');
  readonly sortDir = signal<'asc' | 'desc'>('asc');

  protected readonly columnDefs: ColumnDef[] = [
    { key: 'name', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'vatNumber', label: 'CIF/NIF', sortable: true },
    { key: 'status', label: 'Estado', sortable: true },
    { key: '', label: '' },
  ];

  readonly queryKey = computed(() => ['clients', { page: this.page(), size: this.size, q: this.q(), status: this.statusFilter() || undefined, sort: this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined }] as unknown[]);

  readonly query = injectQuery<Page<ClientResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => firstValueFrom(this.clientService.list(this.page(), this.size, this.q() || undefined, this.sortBy() ? `${this.sortBy()},${this.sortDir()}` : undefined)),
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<ClientResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.remove(id)),
    onMutate: (id) => optimisticRemoveFromPage<ClientResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Cliente eliminado correctamente'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
  }));

  readonly activateMutation = injectMutation<ClientResponse, Error, string, PageData<ClientResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.activate(id)),
    onMutate: (id) => optimisticUpdateInPage<ClientResponse>(this.queryClient, this.queryKey(), id, (c) => ({ ...c, status: 'ACTIVE' })),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
  }));

  readonly deactivateMutation = injectMutation<ClientResponse, Error, string, PageData<ClientResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.deactivate(id)),
    onMutate: (id) => optimisticUpdateInPage<ClientResponse>(this.queryClient, this.queryKey(), id, (c) => ({ ...c, status: 'INACTIVE' })),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
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

  readonly showDeleteDialog = signal(false);
  protected deleteTarget: ClientResponse | null = null;

  confirmDelete(client: ClientResponse) {
    this.deleteTarget = client;
    this.showDeleteDialog.set(true);
  }

  executeDelete() {
    if (this.deleteTarget) {
      this.deleteMutation.mutate(this.deleteTarget.id);
    }
    this.showDeleteDialog.set(false);
    this.deleteTarget = null;
  }
}

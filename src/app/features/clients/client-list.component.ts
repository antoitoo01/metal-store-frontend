import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { ClientResponse, Page } from '../../core/models/api.types';
import { PageData, optimisticRemoveFromPage, optimisticUpdateInPage, rollbackPage } from '../../core/services/optimistic-utils';
import { ButtonComponent } from '../../shared/components/button.component';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { StatusBadgeComponent } from '../../shared/components/status-badge.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';

@Component({
  selector: 'app-client-list',
  imports: [RouterLink, ButtonComponent, PaginationComponent, StatusBadgeComponent, DataStateComponent, TableComponent, SearchInputComponent],
  templateUrl: './client-list.html',
})
export class ClientListComponent {
  private readonly clientService = inject(ClientService);
  private readonly queryClient = inject(QueryClient);

  readonly q = signal('');
  readonly page = signal(0);
  readonly size = 20;

  readonly queryKey = computed(() => ['clients', { page: this.page(), size: this.size, q: this.q() }] as unknown[]);

  readonly query = injectQuery<Page<ClientResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => firstValueFrom(this.clientService.list(this.page(), this.size, this.q() || undefined)),
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<ClientResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.remove(id)),
    onMutate: (id) => optimisticRemoveFromPage<ClientResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
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

  goTo(p: number): void {
    this.page.set(p);
  }
}

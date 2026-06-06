import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { ClientResponse, Page } from '../../core/models/api.types';
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

  readonly query = injectQuery<Page<ClientResponse>>(() => ({
    queryKey: ['clients', { page: this.page(), size: this.size, q: this.q() }],
    queryFn: () => firstValueFrom(this.clientService.list(this.page(), this.size, this.q() || undefined)),
  }));

  readonly deleteMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.remove(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
  }));

  readonly activateMutation = injectMutation<ClientResponse, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.activate(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
  }));

  readonly deactivateMutation = injectMutation<ClientResponse, Error, string>(() => ({
    mutationFn: (id) => firstValueFrom(this.clientService.deactivate(id)),
    onSuccess: () => this.queryClient.invalidateQueries({ queryKey: ['clients'] }),
  }));

  search(term: string): void {
    this.q.set(term);
    this.page.set(0);
  }

  goTo(p: number): void {
    this.page.set(p);
  }
}

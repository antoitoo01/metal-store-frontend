import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient } from '@tanstack/angular-query-experimental';
import { UserService } from './user.service';
import { UserResponse, Page } from '../../core/models/api.types';
import { PaginationComponent } from '../../shared/components/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state.component';
import { TableComponent } from '../../shared/components/table.component';
import { SearchInputComponent } from '../../shared/components/search-input.component';
import { ButtonComponent } from '../../shared/components/button.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog.component';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';

@Component({
  selector: 'app-user-list',
  imports: [PaginationComponent, DataStateComponent, TableComponent, SearchInputComponent, ButtonComponent, ConfirmDialogComponent],
  template: `
    <div class="p-6">
      <div class="flex items-center justify-between">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Usuarios</h1>
      </div>

      <div class="mt-4">
        <app-search-input placeholder="Buscar usuario…" (searchChange)="search($event)" />
      </div>

      <app-data-state [loading]="query.isPending()" [error]="query.isError() ? 'Error al cargar usuarios' : undefined" [empty]="query.data()?.content?.length === 0">
        <app-table [columns]="['Usuario', 'Email', 'Rol', '']">
          @for (u of query.data()?.content; track u.id) {
            <tr>
              <td class="font-medium text-gray-900 dark:text-white">{{ u.username }}</td>
              <td class="text-gray-600 dark:text-gray-400">{{ u.email }}</td>
              <td><span class="inline-block rounded-full bg-primary-100 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-300">{{ u.role }}</span></td>
              <td>
                <app-button variant="ghost" size="sm" (clicked)="confirmDelete(u)" [disabled]="deleteMutation.isPending()">Eliminar</app-button>
              </td>
            </tr>
          }
        </app-table>

        <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goToPage($event)" />
      </app-data-state>
    </div>

    <app-confirm-dialog
      [visible]="showDeleteDialog()"
      title="Eliminar usuario"
      [message]="'¿Estás seguro de que querés eliminar a ' + (deleteTarget()?.username ?? '') + '? Esta acción no se puede deshacer.'"
      variant="danger"
      (confirmed)="executeDelete()"
      (cancelled)="showDeleteDialog.set(false)" />
  `,
})
export class UserListComponent {
  private readonly userService = inject(UserService);
  private readonly queryClient = inject(QueryClient);

  readonly page = signal(0);
  readonly searchQuery = signal('');

  readonly query = injectQuery<Page<UserResponse>>(() => ({
    queryKey: ['users', { page: this.page(), q: this.searchQuery() }],
    queryFn: () => firstValueFrom(this.userService.list({ page: this.page(), q: this.searchQuery() })),
  }));

  readonly deleteMutation = injectMutation<void, Error, string, PageData<UserResponse> | undefined>(() => ({
    mutationFn: (id) => firstValueFrom(this.userService.delete(id)),
    onMutate: (id) => optimisticRemoveFromPage<UserResponse>(this.queryClient, ['users'], id),
    onError: (_err, _id, context) => { if (context) rollbackPage(this.queryClient, ['users'], context); },
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['users'] }),
  }));

  readonly showDeleteDialog = signal(false);
  readonly deleteTarget = signal<UserResponse | null>(null);

  search(q: string) {
    this.searchQuery.set(q);
    this.page.set(0);
  }

  goToPage(p: number) {
    this.page.set(p);
  }

  confirmDelete(user: UserResponse) {
    this.deleteTarget.set(user);
    this.showDeleteDialog.set(true);
  }

  executeDelete() {
    const target = this.deleteTarget();
    if (target) {
      this.deleteMutation.mutate(target.id);
      this.showDeleteDialog.set(false);
      this.deleteTarget.set(null);
    }
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectQuery, injectMutation, QueryClient, keepPreviousData } from '@tanstack/angular-query-experimental';
import { OrganizationService } from './organization.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { InvitationResponse, Page } from '../../core/models/api.types';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { BadgeComponent, BadgeVariant } from '../../shared/components/badge/badge.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { ConfirmDialogComponent } from '../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageData, optimisticRemoveFromPage, rollbackPage } from '../../core/services/optimistic-utils';

const INVITATION_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  ACCEPTED: 'Aceptada',
  DECLINED: 'Rechazada',
  EXPIRED: 'Expirada',
  CANCELLED: 'Cancelada',
};

function invitationBadgeVariant(status: string): BadgeVariant {
  if (status === 'ACCEPTED') return 'success';
  if (status === 'CANCELLED' || status === 'REJECTED' || status === 'EXPIRED') return 'danger';
  if (status === 'PENDING') return 'warning';
  return 'default';
}

@Component({
  selector: 'app-invitation-list',
  imports: [DatePipe, RouterLink, ButtonComponent, BadgeComponent, PaginationComponent, DataStateComponent, ConfirmDialogComponent],
  template: `
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">Invitaciones</h1>
        <a routerLink="/organization/invitations/new" class="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600">
          Nueva invitación
        </a>
      </div>
      <app-data-state
        [loading]="query.isLoading()"
        [empty]="(query.data()?.content?.length ?? 0) === 0"
        [error]="query.isError() ? 'Error al cargar invitaciones' : undefined"
        emptyMessage="No hay invitaciones pendientes."
        [skeleton]="true"
        (retry)="query.refetch()"
      >
        <div class="overflow-hidden rounded-xl border shadow-sm dark:border-gray-700">
          <table class="w-full text-left text-sm">
            <thead class="bg-gray-50 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
              <tr>
                <th scope="col" class="py-2 px-4 font-medium">Email</th>
                <th scope="col" class="py-2 px-4 font-medium">Estado</th>
                <th scope="col" class="py-2 px-4 font-medium">Creada</th>
                <th scope="col" class="py-2 px-4 font-medium">Expira</th>
                <th scope="col" class="py-2 px-4 font-medium"></th>
              </tr>
            </thead>
            <tbody class="divide-y dark:divide-gray-700">
              @for (inv of query.data()?.content ?? []; track inv.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="py-2 px-4 font-medium text-gray-900 dark:text-white">{{ inv.email }}</td>
                  <td class="py-2 px-4">
                    <app-badge [variant]="invitationBadgeVariant(inv.status)">
                      {{ INVITATION_LABELS[inv.status] ?? inv.status }}
                    </app-badge>
                  </td>
                  <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ inv.createdAt | date:'short' }}</td>
                  <td class="py-2 px-4 text-gray-600 dark:text-gray-400">{{ inv.expiresAt | date:'short' }}</td>
                  <td class="py-2 px-4 text-right">
                    @if (inv.status === 'PENDING') {
                      <app-button variant="ghost" size="sm" (clicked)="confirmCancel(inv)">Cancelar</app-button>
                    }
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <div class="mt-4">
          <app-pagination [currentPage]="query.data()?.number ?? 0" [totalPages]="query.data()?.totalPages ?? 0" (pageChange)="goTo($event)" />
        </div>
      </app-data-state>

      <app-confirm-dialog
        [visible]="showCancelDialog()"
        title="Cancelar invitación"
        [message]="'¿Estás seguro de que querés cancelar la invitación de ' + (cancelTarget()?.email ?? '') + '?'"
        variant="danger"
        confirmLabel="Cancelar invitación"
        (confirmed)="executeCancel()"
        (cancelled)="showCancelDialog.set(false)" />
    </div>
  `,
})
export class InvitationListComponent {
  private readonly organizationService = inject(OrganizationService);
  private readonly authService = inject(AuthService);
  private readonly queryClient = inject(QueryClient);
  private readonly notification = inject(NotificationService);

  protected readonly page = signal(0);
  protected readonly size = 20;
  protected readonly showCancelDialog = signal(false);
  protected readonly cancelTarget = signal<InvitationResponse | null>(null);

  protected readonly INVITATION_LABELS = INVITATION_LABELS;
  protected readonly invitationBadgeVariant = invitationBadgeVariant;

  readonly queryKey = computed(() => {
    const orgId = this.authService.user()?.organizationId;
    if (!orgId) return [];
    return ['invitations', orgId, { page: this.page(), size: this.size }] as unknown[];
  });

  readonly query = injectQuery<Page<InvitationResponse>>(() => ({
    queryKey: this.queryKey(),
    queryFn: () => {
      const orgId = this.authService.organizationId;
      if (!orgId) throw new Error('No organization ID');
      return firstValueFrom(this.organizationService.listInvitations(orgId, this.page(), this.size));
    },
    enabled: () => this.queryKey().length > 0,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
  }));

  readonly cancelMutation = injectMutation<void, Error, string, PageData<InvitationResponse> | undefined>(() => ({
    mutationFn: (id) => {
      const orgId = this.authService.organizationId!;
      return firstValueFrom(this.organizationService.cancelInvitation(orgId, id));
    },
    onMutate: (id) => optimisticRemoveFromPage<InvitationResponse>(this.queryClient, this.queryKey(), id),
    onError: (_err, _id, context) => { if (context) rollbackPage(this.queryClient, this.queryKey(), context); },
    onSuccess: () => this.notification.success('Invitación cancelada'),
    onSettled: () => this.queryClient.invalidateQueries({ queryKey: ['invitations'] }),
  }));

  protected confirmCancel(inv: InvitationResponse): void {
    this.cancelTarget.set(inv);
    this.showCancelDialog.set(true);
  }

  protected executeCancel(): void {
    const target = this.cancelTarget();
    if (target) this.cancelMutation.mutate(target.id);
    this.showCancelDialog.set(false);
    this.cancelTarget.set(null);
  }

  protected goTo(p: number): void {
    this.page.set(p);
  }
}

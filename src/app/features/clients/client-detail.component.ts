import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ClientService } from './client.service';
import { QuoteService } from '../quotes/quote.service';
import { ClientResponse, QuoteResponse, Page } from '../../core/models/api.types';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-client-detail',
  imports: [RouterLink, StatusBadgeComponent, BackLinkComponent, DataStateComponent, PaginationComponent, DatePipe],
  template: `
    <div class="p-6">
      <app-back-link path="/clients" label="Volver a clientes" />

      <app-data-state [loading]="clientQuery.isPending()" [error]="clientQuery.isError() ? 'Error al cargar cliente' : undefined" [empty]="false">
        @let c = clientQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ c.name }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ c.vatNumber ?? 'Sin CIF/NIF' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <app-status-badge [status]="c.status" [label]="c.status === 'ACTIVE' ? 'Activo' : 'Inactivo'" />
            <a [routerLink]="['/clients', c.id, 'edit']" class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Editar</a>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Email:</span> {{ c.email ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span> {{ c.phone ?? '—' }}</div>
          <div class="col-span-2"><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ c.address ?? '—' }}</div>
          <div class="col-span-2"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ c.notes ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Creado:</span> {{ c.createdAt | date:'dd/MM/yyyy' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Actualizado:</span> {{ c.updatedAt | date:'dd/MM/yyyy' }}</div>
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Presupuestos</h2>

        <app-data-state [loading]="quotesQuery.isPending()" [error]="quotesQuery.isError() ? 'Error al cargar presupuestos' : undefined" [empty]="(quotesQuery.data()?.content?.length ?? 0) === 0" emptyMessage="Este cliente no tiene presupuestos.">
          <table class="w-full text-left text-sm">
            <thead class="border-b border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
              <tr>
                <th class="px-4 py-2 font-medium">Número</th>
                <th class="px-4 py-2 font-medium">Fecha</th>
                <th class="px-4 py-2 font-medium">Total</th>
                <th class="px-4 py-2 font-medium">Estado</th>
                <th class="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
              @for (q of quotesQuery.data()?.content; track q.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ q.quoteNumber }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ q.issueDate | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2 text-gray-900 dark:text-white">{{ q.total.toFixed(2) }} €</td>
                  <td class="px-4 py-2"><app-status-badge [status]="q.status" /></td>
                  <td class="px-4 py-2 text-right"><a [routerLink]="['/quotes', q.id]" class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mt-4">
            <app-pagination [currentPage]="quotesQuery.data()?.number ?? 0" [totalPages]="quotesQuery.data()?.totalPages ?? 0" (pageChange)="quotesPage.set($event)" />
          </div>
        </app-data-state>
      </app-data-state>
    </div>
  `,
})
export class ClientDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly clientService = inject(ClientService);
  private readonly quoteService = inject(QuoteService);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly clientQuery = injectQuery<ClientResponse>(() => ({
    queryKey: ['client', this.id],
    queryFn: () => firstValueFrom(this.clientService.get(this.id)),
  }));

  readonly quotesPage = signal(0);

  readonly quotesQuery = injectQuery<Page<QuoteResponse>>(() => ({
    queryKey: ['client-quotes', this.id, this.quotesPage()],
    queryFn: () => firstValueFrom(this.quoteService.list(this.quotesPage(), 20, undefined, this.id)),
  }));
}

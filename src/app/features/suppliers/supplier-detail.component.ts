import { Component, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupplierService } from './supplier.service';
import { SupplierResponse, PurchaseOrderResponse, InboundDNResponse, Page } from '../../core/models/api.types';
import { environment } from '../../../environments/environment';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { BackLinkComponent } from '../../shared/components/back-link/back-link.component';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { PaginationComponent } from '../../shared/components/pagination/pagination.component';

@Component({
  selector: 'app-supplier-detail',
  imports: [RouterLink, DatePipe, StatusBadgeComponent, BackLinkComponent, DataStateComponent, PaginationComponent],
  template: `
    <div class="p-6">
      <app-back-link path="/suppliers" label="Volver a proveedores" />

      <app-data-state [loading]="supplierQuery.isPending()" [error]="supplierQuery.isError() ? 'Error al cargar proveedor' : undefined" [empty]="false">
        @let s = supplierQuery.data()!;

        <div class="mt-4 flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ s.name }}</h1>
            <p class="mt-1 text-sm text-gray-500 dark:text-gray-400">{{ s.vatNumber ?? 'Sin CIF/NIF' }}</p>
          </div>
          <div class="flex items-center gap-2">
            <app-status-badge [status]="s.status" [label]="s.status === 'ACTIVE' ? 'Activo' : 'Inactivo'" />
            <a [routerLink]="['/suppliers', s.id, 'edit']" class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Editar</a>
          </div>
        </div>

        <div class="mt-6 grid grid-cols-2 gap-4 text-sm">
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Email:</span> {{ s.email ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Teléfono:</span> {{ s.phone ?? '—' }}</div>
          <div class="col-span-2"><span class="font-medium text-gray-700 dark:text-gray-300">Dirección:</span> {{ s.address ?? '—' }}</div>
          <div class="col-span-2"><span class="font-medium text-gray-700 dark:text-gray-300">Notas:</span> {{ s.notes ?? '—' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Creado:</span> {{ s.createdAt | date:'dd/MM/yyyy' }}</div>
          <div><span class="font-medium text-gray-700 dark:text-gray-300">Actualizado:</span> {{ s.updatedAt | date:'dd/MM/yyyy' }}</div>
        </div>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Órdenes de compra</h2>

        <app-data-state [loading]="poQuery.isPending()" [error]="poQuery.isError() ? 'Error al cargar órdenes de compra' : undefined" [empty]="(poQuery.data()?.content?.length ?? 0) === 0" emptyMessage="Este proveedor no tiene órdenes de compra.">
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
              @for (po of poQuery.data()?.content; track po.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ po.poNumber }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ po.issueDate | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2 text-gray-900 dark:text-white">{{ po.total.toFixed(2) }} €</td>
                  <td class="px-4 py-2"><app-status-badge [status]="po.status" /></td>
                  <td class="px-4 py-2 text-right"><a [routerLink]="['/purchase-orders', po.id]" class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mt-4">
            <app-pagination [currentPage]="poQuery.data()?.number ?? 0" [totalPages]="poQuery.data()?.totalPages ?? 0" (pageChange)="poPage.set($event)" />
          </div>
        </app-data-state>

        <h2 class="mt-8 text-lg font-semibold text-gray-900 dark:text-white">Albaranes de entrada</h2>

        <app-data-state [loading]="dnQuery.isPending()" [error]="dnQuery.isError() ? 'Error al cargar albaranes' : undefined" [empty]="(dnQuery.data()?.content?.length ?? 0) === 0" emptyMessage="Este proveedor no tiene albaranes de entrada.">
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
              @for (dn of dnQuery.data()?.content; track dn.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-slate-800">
                  <td class="px-4 py-2 font-medium text-gray-900 dark:text-white">{{ dn.number }}</td>
                  <td class="px-4 py-2 text-gray-600 dark:text-gray-400">{{ dn.issueDate | date:'dd/MM/yyyy' }}</td>
                  <td class="px-4 py-2 text-gray-900 dark:text-white">{{ dn.totalAmount.toFixed(2) }} €</td>
                  <td class="px-4 py-2"><app-status-badge [status]="dn.status" /></td>
                  <td class="px-4 py-2 text-right"><a [routerLink]="['/inbound', dn.id]" class="text-blue-600 hover:text-blue-700 dark:text-blue-400">Ver</a></td>
                </tr>
              }
            </tbody>
          </table>
          <div class="mt-4">
            <app-pagination [currentPage]="dnQuery.data()?.number ?? 0" [totalPages]="dnQuery.data()?.totalPages ?? 0" (pageChange)="dnPage.set($event)" />
          </div>
        </app-data-state>
      </app-data-state>
    </div>
  `,
})
export class SupplierDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly supplierService = inject(SupplierService);
  private readonly http = inject(HttpClient);

  readonly id = this.route.snapshot.params['id'] as string;

  readonly supplierQuery = injectQuery<SupplierResponse>(() => ({
    queryKey: ['supplier', this.id],
    queryFn: () => firstValueFrom(this.supplierService.get(this.id)),
  }));

  readonly poPage = signal(0);

  readonly poQuery = injectQuery<Page<PurchaseOrderResponse>>(() => ({
    queryKey: ['supplier-pos', this.id, this.poPage()],
    queryFn: () => firstValueFrom(
      this.http.get<Page<PurchaseOrderResponse>>(`${environment.apiUrl}/api/purchase-orders`, {
        params: { page: this.poPage(), size: 20, supplierId: this.id },
      }),
    ),
  }));

  readonly dnPage = signal(0);

  readonly dnQuery = injectQuery<Page<InboundDNResponse>>(() => ({
    queryKey: ['supplier-dns', this.id, this.dnPage()],
    queryFn: () => firstValueFrom(
      this.http.get<Page<InboundDNResponse>>(`${environment.apiUrl}/api/inbound-delivery-notes`, {
        params: { page: this.dnPage(), size: 20, supplierId: this.id },
      }),
    ),
  }));
}

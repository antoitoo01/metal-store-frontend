import { Component, inject } from '@angular/core';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { DashboardService, DashboardData } from '../../core/services/dashboard.service';
import { KpiCardComponent } from '../../shared/components/kpi-card/kpi-card.component';
import { RouterLink } from '@angular/router';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { CardComponent } from '../../shared/components/card/card.component';

@Component({
  selector: 'app-dashboard',
  imports: [KpiCardComponent, RouterLink, StatusBadgeComponent, CardComponent],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Panel principal</h1>
      <p class="mt-2 text-gray-600 dark:text-gray-400">Bienvenido a Metal Store</p>

      <div class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <app-kpi-card label="Clientes" [value]="data()?.clientCount ?? null" [loading]="query.isPending()" route="/clients" />
        <app-kpi-card label="Inventario" [value]="data()?.inventoryCount ?? null" [loading]="query.isPending()" route="/inventory" />
        <app-kpi-card label="Presupuestos" [value]="data()?.quoteCount ?? null" [loading]="query.isPending()" route="/quotes" />
        <app-kpi-card label="Facturas" [value]="data()?.invoiceCount ?? null" [loading]="query.isPending()" route="/billing/invoices" />
      </div>

      <div class="mt-8 grid gap-6 lg:grid-cols-2">
        <app-card>
          <div header>Presupuestos recientes</div>
          <div body>
            @let quotes = data()?.recentQuotes;
            @if (query.isPending()) {
              <p class="text-sm text-gray-500">Cargando…</p>
            } @else if (!quotes || quotes.length === 0) {
              <p class="text-sm text-gray-500">Sin presupuestos</p>
            } @else {
              <div class="space-y-2">
                @for (q of quotes; track q.id) {
                  <div class="flex items-center justify-between text-sm">
                    <a [routerLink]="['/quotes', q.id]" class="font-medium text-primary-600 hover:underline">{{ q.quoteNumber }}</a>
                    <span>{{ q.customerName }}</span>
                    <app-status-badge [status]="q.status" />
                  </div>
                }
              </div>
            }
          </div>
          <div footer>
            <a routerLink="/quotes" class="text-sm text-primary-600 hover:underline">Ver todos</a>
          </div>
        </app-card>

        <app-card>
          <div header>Facturas recientes</div>
          <div body>
            @let invoices = data()?.recentInvoices;
            @if (query.isPending()) {
              <p class="text-sm text-gray-500">Cargando…</p>
            } @else if (!invoices || invoices.length === 0) {
              <p class="text-sm text-gray-500">Sin facturas</p>
            } @else {
              <div class="space-y-2">
                @for (inv of invoices; track inv.id) {
                  <div class="flex items-center justify-between text-sm">
                    <a [routerLink]="['/billing/invoices', inv.id]" class="font-medium text-primary-600 hover:underline">{{ inv.invoiceNumber }}</a>
                    <span>{{ inv.customerName }}</span>
                    <app-status-badge [status]="inv.status" />
                  </div>
                }
              </div>
            }
          </div>
          <div footer>
            <a routerLink="/billing/invoices" class="text-sm text-primary-600 hover:underline">Ver todas</a>
          </div>
        </app-card>
      </div>
    </div>
  `,
})
export class DashboardComponent {
  private readonly dashboard = inject(DashboardService);

  readonly query = injectQuery<DashboardData>(() => ({
    queryKey: ['dashboard'],
    queryFn: () => this.dashboard.getDashboardData(),
    refetchInterval: 30_000,
  }));

  protected readonly data = this.query.data;
}

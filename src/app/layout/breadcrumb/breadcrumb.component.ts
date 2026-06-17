import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';

interface Breadcrumb {
  label: string;
  url: string;
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clients': 'Clientes',
  '/clients/new': 'Nuevo cliente',
  '/catalog': 'Catálogo',
  '/catalog/profiles': 'Perfiles',
  '/catalog/items': 'Ítems',
  '/catalog/families': 'Familias',
  '/catalog/item-types': 'Tipos de ítem',
  '/inventory': 'Inventario',
  '/inventory/new': 'Nuevo',
  '/quotes': 'Presupuestos',
  '/quotes/new': 'Nuevo presupuesto',
  '/billing': 'Facturación',
  '/billing/invoices': 'Facturas',
  '/billing/invoices/new': 'Nueva factura',
  '/billing/prices': 'Precios',
};

@Component({
  selector: 'app-breadcrumb',
  imports: [RouterLink],
  template: `
    <nav aria-label="Breadcrumb" class="flex items-center gap-1 overflow-hidden text-sm text-gray-500 dark:text-gray-400">
      <a routerLink="/dashboard" class="shrink-0 hover:text-gray-700 dark:hover:text-gray-200">Inicio</a>
      @for (crumb of breadcrumbs(); track crumb.url; let last = $last) {
        <span class="mx-1">/</span>
        @if (last) {
          <span class="font-medium text-gray-900 dark:text-white">{{ crumb.label }}</span>
        } @else {
          <a [routerLink]="crumb.url" class="hover:text-gray-700 dark:hover:text-gray-200">{{ crumb.label }}</a>
        }
      }
    </nav>
  `,
})
export class BreadcrumbComponent {
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly breadcrumbs = signal<Breadcrumb[]>([]);

  constructor() {
    this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => this.#buildBreadcrumbs());
  }

  #buildBreadcrumbs(): void {
    const items: Breadcrumb[] = [];
    const segments = this.router.url.split('/').filter(Boolean);
    let url = '';

    for (const segment of segments) {
      url += `/${segment}`;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(segment);
      const label = isUuid ? 'Detalle' : (BREADCRUMB_MAP[url] ?? segment.charAt(0).toUpperCase() + segment.slice(1));
      items.push({ label, url });
    }

    this.breadcrumbs.set(items);
  }
}

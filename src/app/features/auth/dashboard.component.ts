import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink],
  template: `
    <div class="p-8">
      <h1 class="text-2xl font-bold text-gray-900">Panel principal</h1>
      <p class="mt-2 text-gray-600">Bienvenido a Metal Store</p>

      <nav class="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        @for (link of links; track link.label) {
          <a [routerLink]="link.path" class="rounded-xl border p-5 shadow-sm hover:shadow-md">
            <h2 class="font-semibold text-gray-900">{{ link.label }}</h2>
            <p class="mt-1 text-sm text-gray-500">{{ link.description }}</p>
          </a>
        }
      </nav>
    </div>
  `,
})
export class DashboardComponent {
  readonly links = [
    { label: 'Clientes', path: '/clients', description: 'Gestionar clientes' },
    { label: 'Catálogo', path: '/catalog', description: 'Perfiles y artículos' },
    { label: 'Inventario', path: '/inventory', description: 'Stock y existencias' },
    { label: 'Presupuestos', path: '/quotes', description: 'Crear y gestionar presupuestos' },
    { label: 'Facturación', path: '/billing', description: 'Facturas y precios' },
  ];
}

import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-catalog-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="p-6">
      <h1 class="text-2xl font-bold text-gray-900">Catálogo</h1>

      <nav class="mt-4 flex gap-4 border-b border-gray-200">
        @for (tab of tabs; track tab.path) {
          <a [routerLink]="tab.path" routerLinkActive="border-blue-600 text-blue-600"
            class="-mb-px border-b-2 border-transparent px-1 pb-2 text-sm font-medium text-gray-500 hover:text-gray-700">
            {{ tab.label }}
          </a>
        }
      </nav>

      <div class="mt-6">
        <router-outlet />
      </div>
    </div>
  `,
})
export class CatalogLayoutComponent {
  readonly tabs = [
    { label: 'Perfiles', path: '/catalog/profiles' },
    { label: 'Artículos', path: '/catalog/items' },
    { label: 'Familias', path: '/catalog/families' },
    { label: 'Tipos de artículo', path: '/catalog/item-types' },
  ];
}

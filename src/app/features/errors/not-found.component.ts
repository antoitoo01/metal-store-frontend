import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div class="w-full max-w-md text-center">
        <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600">404</h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Página no encontrada</p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-500">La página que buscás no existe o fue movida.</p>
        <a routerLink="/dashboard" class="mt-6 inline-block">
          <app-button variant="primary">Volver al dashboard</app-button>
        </a>
      </div>
    </div>
  `,
})
export class NotFoundComponent {}

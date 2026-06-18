import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-server-error',
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div class="w-full max-w-md text-center">
        <h1 class="text-6xl font-bold text-gray-300 dark:text-gray-600">500</h1>
        <p class="mt-4 text-lg text-gray-600 dark:text-gray-400">Error del servidor</p>
        <p class="mt-2 text-sm text-gray-500 dark:text-gray-500">
          Algo salió mal del otro lado. Puede ser un problema temporal. Si persiste, contactá al administrador.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <app-button variant="primary" (clicked)="reload()">Intentar de nuevo</app-button>
          <a routerLink="/dashboard">
            <app-button variant="secondary">Volver al dashboard</app-button>
          </a>
        </div>
      </div>
    </div>
  `,
})
export class ServerErrorComponent {
  protected reload(): void {
    window.location.reload();
  }
}

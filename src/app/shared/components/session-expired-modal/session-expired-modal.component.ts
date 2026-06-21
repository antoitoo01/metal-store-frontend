import { Component, ChangeDetectionStrategy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-session-expired-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonComponent],
  styles: `
    :host { display: contents; }
  `,
  template: `
    @if (authService.sessionExpired()) {
      <div class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-labelledby="session-expired-title"
          class="mx-4 w-full max-w-md rounded-xl bg-white p-8 shadow-2xl dark:bg-gray-800"
        >
          <div class="flex flex-col items-center text-center">
            <div class="flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <svg class="h-8 w-8 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m0 0v2m0-2h2m-2 0H10m9.364-7.364A9 9 0 1112 3a9 9 0 017.364 4.636z" />
              </svg>
            </div>
            <h2 id="session-expired-title" class="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
              Sesión expirada
            </h2>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Tu sesión ha expirado. Por favor, inicia sesión de nuevo para continuar.
            </p>
            <div class="mt-6">
              <app-button variant="primary" (clicked)="goToLogin()">
                Iniciar sesión
              </app-button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class SessionExpiredModalComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected goToLogin(): void {
    this.authService.clearSessionExpired();
    this.router.navigate(['/login']);
  }
}

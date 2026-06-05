import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../core/services/auth.service';

@Component({
  selector: 'app-topbar',
  standalone: true,
  template: `
    <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <div>
        <ng-content select="[breadcrumbs]" />
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm text-gray-600">
          {{ authService.user()?.email ?? 'Invitado' }}
        </span>
        <button
          (click)="logout()"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
          Cerrar sesión
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

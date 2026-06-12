import { Component, inject, output } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-topbar',
  imports: [AppIconComponent],
  template: `
    <header class="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 dark:border-gray-700 dark:bg-slate-900">
      <div class="flex items-center gap-3">
        <button
          type="button"
          (click)="toggleMenu.emit()"
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 lg:hidden"
          aria-label="Abrir menú"
        >
          <app-icon name="menu" [size]="20" />
        </button>
        <ng-content select="[breadcrumbs]" />
      </div>
      <div class="flex items-center gap-4">
        <button
          (click)="theme.toggle()"
          class="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          [attr.aria-label]="theme.isDark() ? 'Activar modo claro' : 'Activar modo oscuro'"
        >
          @if (theme.isDark()) {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
          } @else {
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-5 w-5"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          }
        </button>
        <span class="text-sm text-gray-600 dark:text-gray-400">
          {{ authService.user()?.username ?? 'Invitado' }}
        </span>
        <button
          (click)="logout()"
          class="rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white">
          Cerrar sesión
        </button>
      </div>
    </header>
  `,
})
export class TopbarComponent {
  protected readonly authService = inject(AuthService);
  protected readonly theme = inject(ThemeService);
  private readonly router = inject(Router);

  readonly toggleMenu = output<void>();

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

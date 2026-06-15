import { Component, inject, output, signal, computed } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { injectQueryClient } from '@tanstack/angular-query-experimental';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { AppIconComponent } from '../../shared/components/app-icon/app-icon.component';

@Component({
  selector: 'app-topbar',
  imports: [RouterLink, AppIconComponent],
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
      <div class="flex items-center gap-2">
        @if (orgs().length > 1) {
          <div class="relative">
            <button
              (click)="showOrgMenu.set(!showOrgMenu())"
              (blur)="showOrgMenu.set(false)"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><path d="M3 21h18"/><path d="M6 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M10 21v-4h4v4"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h4"/></svg>
              {{ currentOrgName() }}
              <svg class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clip-rule="evenodd"/></svg>
            </button>
            @if (showOrgMenu()) {
              <div class="absolute right-0 z-20 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-600 dark:bg-gray-800">
                @for (org of orgs(); track org.organizationId) {
                  <button
                    type="button"
                    (mousedown)="switchOrg(org.organizationId)"
                    class="flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                    [class.font-semibold]="org.organizationId === activeOrgId()"
                    [class.text-gray-900]="org.organizationId === activeOrgId()"
                    [class.text-gray-600]="org.organizationId !== activeOrgId()"
                    [class.dark:text-white]="org.organizationId === activeOrgId()"
                    [class.dark:text-gray-300]="org.organizationId !== activeOrgId()"
                  >
                    @if (org.organizationId === activeOrgId()) {
                      <svg class="h-4 w-4 shrink-0 text-blue-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/></svg>
                    } @else {
                      <span class="block h-4 w-4 shrink-0"></span>
                    }
                    <span class="flex-1 truncate">{{ org.organizationName }}</span>
                    <span class="text-xs text-gray-400 dark:text-gray-500">{{ org.role }}</span>
                  </button>
                }
              </div>
            }
          </div>
        } @else if (orgs().length === 1) {
          <span class="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4 shrink-0"><path d="M3 21h18"/><path d="M6 21V7a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v14"/><path d="M10 21v-4h4v4"/><path d="M10 7h4"/><path d="M10 11h4"/><path d="M10 15h4"/></svg>
            {{ orgs()[0].organizationName }}
          </span>
        }
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
        <a routerLink="/profile" class="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          {{ authService.user()?.username ?? 'Invitado' }}
        </a>
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
  private readonly queryClient = injectQueryClient();

  readonly toggleMenu = output<void>();
  readonly showOrgMenu = signal(false);

  protected readonly orgs = this.authService.organizations;
  protected readonly activeOrgId = computed(() => this.authService.organizationId);
  protected readonly currentOrgName = computed(() => {
    const orgs = this.orgs();
    const id = this.activeOrgId();
    return orgs.find(o => o.organizationId === id)?.organizationName ?? 'Organización';
  });

  protected switchOrg(orgId: string): void {
    this.showOrgMenu.set(false);
    if (orgId === this.activeOrgId()) return;
    this.authService.switchOrganization(orgId);
    this.queryClient.invalidateQueries();
  }

  protected logout(): void {
    this.authService.logout().subscribe({
      next: () => this.router.navigate(['/login']),
      error: () => this.router.navigate(['/login']),
    });
  }
}

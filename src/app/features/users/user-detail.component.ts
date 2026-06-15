import { Component, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectQuery } from '@tanstack/angular-query-experimental';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { UserService } from './user.service';
import { AuthService } from '../../core/services/auth.service';
import { UserResponse } from '../../core/models/api.types';
import { DataStateComponent } from '../../shared/components/data-state/data-state.component';
import { BadgeComponent } from '../../shared/components/badge/badge.component';

@Component({
  selector: 'app-user-detail',
  imports: [DataStateComponent, BadgeComponent, RouterLink],
  template: `
    <div class="mx-auto max-w-lg">
      <a routerLink="/users" class="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400">&larr; Volver a usuarios</a>

      <app-data-state
        [loading]="query.isPending()"
        [error]="query.isError() ? 'Error al cargar usuario' : undefined"
        [empty]="false"
      >
        @if (query.data(); as u) {
          <div class="mt-4 rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-slate-900">
            <div class="flex items-start justify-between">
              <div>
                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">{{ u.username }}</h1>
                <p class="mt-1 text-gray-500 dark:text-gray-400">{{ u.email }}</p>
              </div>
            </div>

            <dl class="mt-6 space-y-4 text-sm">
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Rol</dt>
                <dd><app-badge>{{ u.role }}</app-badge></dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Organización</dt>
                <dd class="text-gray-900 dark:text-white">{{ u.organizationName }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-gray-500 dark:text-gray-400">Email</dt>
                <dd class="text-gray-900 dark:text-white">{{ u.email }}</dd>
              </div>
            </dl>

            @if (u.id === auth.user()?.id) {
              <p class="mt-6 text-xs text-gray-400 dark:text-gray-500">Este es tu usuario</p>
            }
          </div>
        }
      </app-data-state>
    </div>
  `,
})
export class UserDetailComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly userService = inject(UserService);
  protected readonly auth = inject(AuthService);

  private readonly userId = signal<string | null>(null);

  readonly query = injectQuery<UserResponse>(() => ({
    queryKey: ['users', this.userId()],
    enabled: !!this.userId(),
    queryFn: () => firstValueFrom(this.userService.get(this.userId()!)),
  }));

  constructor() {
    this.route.paramMap.subscribe(params => this.userId.set(params.get('id')));
  }
}

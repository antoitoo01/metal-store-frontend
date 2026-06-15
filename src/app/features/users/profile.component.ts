import { Component, inject, signal, computed } from '@angular/core';
import { form, FormField, required, email } from '@angular/forms/signals';
import { RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { UserService } from './user.service';
import { NotificationService } from '../../core/services/notification.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-profile',
  imports: [FormField, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="mx-auto max-w-lg">
      <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Mi perfil</h1>

      @if (error()) {
        <div class="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{{ error() }}</div>
      }

      <form (submit)="save($event)" class="mt-6 space-y-6">
        <app-input
          [formField]="form.username"
          label="Nombre de usuario"
          placeholder="ej: metalero89"
          [error]="usernameError()"
        />

        <app-input
          [formField]="form.email"
          label="Email"
          type="email"
          placeholder="tu@email.com"
          [error]="emailError()"
        />

        <div class="flex items-center gap-3">
          <app-button type="submit" variant="primary" [loading]="saving()" [disabled]="form().invalid() || saving()">
            Guardar cambios
          </app-button>
          <a routerLink="/dashboard" class="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">Cancelar</a>
        </div>
      </form>
    </div>
  `,
})
export class ProfileComponent {
  private readonly auth = inject(AuthService);
  private readonly userService = inject(UserService);
  private readonly notification = inject(NotificationService);

  readonly saving = signal(false);
  readonly error = signal('');

  readonly model = signal({
    username: this.auth.user()?.username ?? '',
    email: this.auth.user()?.email ?? '',
  });

  readonly form = form(this.model, (f) => {
    required(f.username, { message: 'Usuario requerido' });
    required(f.email, { message: 'Email requerido' });
    email(f.email, { message: 'Formato de email inválido' });
  });

  readonly usernameError = computed(() => {
    const field = this.form.username();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly emailError = computed(() => {
    const field = this.form.email();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  save(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.error.set('');
    this.saving.set(true);
    this.userService.update(this.model()).subscribe({
      next: (user) => {
        this.auth.user.set(user);
        this.saving.set(false);
        this.notification.success('Perfil actualizado correctamente');
      },
      error: (err: HttpErrorResponse) => {
        this.saving.set(false);
        this.error.set(err.error?.errors?.[0]?.message ?? err.error?.detail ?? 'Error al actualizar el perfil');
      },
    });
  }
}

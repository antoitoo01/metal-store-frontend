import { Component, inject, signal, computed } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';

interface RegisterFormData {
  email: string;
  password: string;
  username: string;
  tenantName: string;
}

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <form (ngSubmit)="register()" class="w-full max-w-sm space-y-7 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
        <div class="space-y-1">
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Metal Store</h1>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">Crea tu cuenta</p>
        </div>

        @if (error()) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{{ error() }}</div>
        }

        <app-input
          [formField]="form.email"
          label="Email"
          type="email"
          placeholder="tu@email.com"
          [error]="emailError()"
        />

        <app-input
          [formField]="form.password"
          label="Contraseña"
          type="password"
          placeholder="••••••••"
          [error]="passwordError()"
        />

        <app-input
          [formField]="form.username"
          label="Nombre de usuario"
          placeholder="ej: metalero89"
          [error]="usernameError()"
        />

        <app-input
          [formField]="form.tenantName"
          label="Nombre de la empresa"
          placeholder="ej: Aceros del Sur"
          [error]="tenantNameError()"
        />

        <app-button type="submit" variant="primary" size="lg" [block]="true" [disabled]="form().invalid() || loading()" [loading]="loading()">
          Registrarse
        </app-button>

        <p class="text-center text-sm text-gray-500 dark:text-gray-400">
          ¿Ya tienes cuenta?
          <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300">Inicia sesión</a>
        </p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');
  readonly loading = signal(false);

  readonly model = signal<RegisterFormData>({
    email: '',
    password: '',
    username: '',
    tenantName: '',
  });

  readonly form = form(this.model, (f) => {
    required(f.email, { message: 'Email válido requerido' });
    required(f.password, { message: 'Contraseña requerida' });
    required(f.tenantName, { message: 'Nombre de empresa requerido' });
  });

  readonly emailError = computed(() => {
    const field = this.form.email();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly passwordError = computed(() => {
    const field = this.form.password();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly usernameError = computed(() => {
    const field = this.form.username();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly tenantNameError = computed(() => {
    const field = this.form.tenantName();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  register(): void {
    if (this.form().invalid()) return;

    this.error.set('');
    this.loading.set(true);
    this.auth.register(this.model()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.detail ?? err.error?.message ?? 'Error al registrarse');
      },
    });
  }
}

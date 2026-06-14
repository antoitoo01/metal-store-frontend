import { Component, inject, signal, computed } from '@angular/core';
import { form, FormField, required, email, pattern } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input/input.component';
import { ButtonComponent } from '../../shared/components/button/button.component';

interface PasswordRule {
  key: string;
  label: string;
  test: (v: string) => boolean;
}

const PASSWORD_RULES: PasswordRule[] = [
  { key: 'minLength', label: 'Mínimo 8 caracteres', test: (v) => v.length >= 8 },
  { key: 'uppercase', label: 'Una mayúscula', test: (v) => /[A-Z]/.test(v) },
  { key: 'lowercase', label: 'Una minúscula', test: (v) => /[a-z]/.test(v) },
  { key: 'number', label: 'Un número', test: (v) => /\d/.test(v) },
  { key: 'special', label: 'Un carácter especial', test: (v) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v) },
];

interface RegisterFormData {
  email: string;
  password: string;
  username: string;
  organizationName: string;
}

@Component({
  selector: 'app-register',
  imports: [FormField, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <form (submit)="register($event)" class="w-full max-w-sm space-y-7 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
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

        <div class="space-y-1">
          @for (check of passwordChecks(); track check.key) {
            <p class="flex items-center gap-1.5 text-xs"
               [class.text-green-600]="check.met"
               [class.text-red-500]="!check.met && check.hasInput"
               [class.text-gray-400]="!check.hasInput">
              @if (check.met) {
                <svg class="h-3.5 w-3.5 shrink-0" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path d="M13.78 4.22a.75.75 0 010 1.06l-7.25 7.25a.75.75 0 01-1.06 0L2.22 9.28a.75.75 0 011.06-1.06L6 10.94l6.72-6.72a.75.75 0 011.06 0z"/></svg>
              } @else {
                <span class="block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-current" aria-hidden="true"></span>
              }
              {{ check.label }}
            </p>
          }
        </div>

        <app-input
          [formField]="form.username"
          label="Nombre de usuario"
          placeholder="ej: metalero89"
          [error]="usernameError()"
        />

        <app-input
          [formField]="form.organizationName"
          label="Nombre de la empresa (opcional)"
          placeholder="ej: Aceros del Sur"
          [error]="organizationNameError()"
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
    organizationName: '',
  });

  readonly form = form(this.model, (f) => {
    required(f.email, { message: 'Email requerido' });
    email(f.email, { message: 'Formato de email inválido' });
    required(f.password, { message: 'Contraseña requerida' });
    pattern(f.password, /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/, {
      message: 'Debe cumplir todos los requisitos de contraseña',
    });

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

  readonly organizationNameError = computed(() => {
    const field = this.form.organizationName();
    if (!field.touched()) return undefined;
    return field.errors()[0]?.message;
  });

  readonly passwordChecks = computed(() => {
    const value = this.model().password;
    return PASSWORD_RULES.map(rule => ({
      ...rule,
      met: rule.test(value),
      hasInput: value.length > 0,
    }));
  });

  register(event: Event): void {
    event.preventDefault();
    if (this.form().invalid()) return;

    this.error.set('');
    this.loading.set(true);
    this.auth.register({
      email: this.model().email,
      password: this.model().password,
      username: this.model().username,
      tenantName: this.model().organizationName || undefined,
    }).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.loading.set(false);
        this.error.set(err.error?.errors?.[0]?.message ?? err.error?.detail ?? err.error?.message ?? 'Error al registrarse');
      },
    });
  }
}

import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50">
      <form [formGroup]="form" (ngSubmit)="register()" class="w-full max-w-sm space-y-5 rounded-xl bg-white p-8 shadow-lg">
        <div class="text-center">
          <h1 class="text-2xl font-bold text-gray-900">Metal Store</h1>
          <p class="mt-1 text-sm text-gray-500">Creá tu cuenta</p>
        </div>

        @if (error()) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700">{{ error() }}</div>
        }

        <div>
          <label for="email" class="block text-sm font-medium text-gray-700">Email</label>
          <input
            id="email"
            type="email"
            formControlName="email"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="tu@email.com"
          />
          @if (form.controls.email.touched && form.controls.email.invalid) {
            <p class="mt-1 text-xs text-red-600">Email válido requerido</p>
          }
        </div>

        <div>
          <label for="password" class="block text-sm font-medium text-gray-700">Contraseña</label>
          <input
            id="password"
            type="password"
            formControlName="password"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="••••••••"
          />
          @if (form.controls.password.touched && form.controls.password.invalid) {
            <p class="mt-1 text-xs text-red-600">Mínimo 8 caracteres</p>
          }
        </div>

        <div>
          <label for="username" class="block text-sm font-medium text-gray-700">Nombre de usuario</label>
          <input
            id="username"
            type="text"
            formControlName="username"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ej: metalero89"
          />
        </div>

        <div>
          <label for="tenantName" class="block text-sm font-medium text-gray-700">Nombre de la empresa</label>
          <input
            id="tenantName"
            type="text"
            formControlName="tenantName"
            class="mt-1 block w-full rounded-lg border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            placeholder="ej: Aceros del Sur"
          />
        </div>

        <button
          type="submit"
          [disabled]="form.invalid"
          class="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50"
        >
          Registrarse
        </button>

        <p class="text-center text-sm text-gray-500">
          ¿Ya tenés cuenta?
          <a routerLink="/login" class="font-medium text-blue-600 hover:text-blue-500">Iniciá sesión</a>
        </p>
      </form>
    </div>
  `,
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly error = signal('');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    username: [''],
    tenantName: [''],
  });

  register(): void {
    if (this.form.invalid) return;

    this.error.set('');
    this.auth.register(this.form.getRawValue()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: (err: HttpErrorResponse) => {
        this.error.set(err.error?.detail ?? err.error?.message ?? 'Error al registrarse');
      },
    });
  }
}

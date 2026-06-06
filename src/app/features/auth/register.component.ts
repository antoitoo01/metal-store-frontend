import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { AuthService } from '../../core/services/auth.service';
import { InputComponent } from '../../shared/components/input.component';
import { ButtonComponent } from '../../shared/components/button.component';

@Component({
  selector: 'app-register',
  imports: [ReactiveFormsModule, RouterLink, InputComponent, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <form [formGroup]="form" (ngSubmit)="register()" class="w-full max-w-sm space-y-7 rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
        <div class="space-y-1">
          <h1 class="text-center text-2xl font-bold text-gray-900 dark:text-white">Metal Store</h1>
          <p class="text-center text-sm text-gray-500 dark:text-gray-400">Crea tu cuenta</p>
        </div>

        @if (error()) {
          <div class="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-400">{{ error() }}</div>
        }

        <app-input formControlName="email" label="Email" type="email" placeholder="tu@email.com" />
        @if (form.controls.email.touched && form.controls.email.invalid) {
          <p class="mt-1 text-xs text-red-600">Email válido requerido</p>
        }

        <app-input formControlName="password" label="Contraseña" type="password" placeholder="••••••••" />
        @if (form.controls.password.touched && form.controls.password.invalid) {
          <p class="mt-1 text-xs text-red-600">Mínimo 8 caracteres</p>
        }

        <app-input formControlName="username" label="Nombre de usuario" placeholder="ej: metalero89" />

        <app-input formControlName="tenantName" label="Nombre de la empresa" placeholder="ej: Aceros del Sur" />

        <app-button type="submit" variant="primary" size="lg" [block]="true" [disabled]="form.invalid">
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

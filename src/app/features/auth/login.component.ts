import { Component, inject, signal, computed } from '@angular/core';
import { form, FormField, required } from '@angular/forms/signals';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ButtonComponent } from '../../shared/components/button.component';
import { InputComponent } from '../../shared/components/input.component';

interface LoginFormData {
  email: string;
  password: string;
}

@Component({
  selector: 'app-login',
  imports: [FormField, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './login.html',
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly rememberMe = signal(false);

  readonly model = signal<LoginFormData>({ email: '', password: '' });

  readonly form = form(this.model, (f) => {
    required(f.email, { message: 'El email es obligatorio' });
    required(f.password, { message: 'La contraseña es obligatoria' });
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

  login(): void {
    if (this.form().invalid()) return;

    this.loading.set(true);
    this.auth.login(this.model(), this.rememberMe()).subscribe({
      next: () => this.router.navigate(['/dashboard']),
      error: () => this.loading.set(false),
    });
  }
}

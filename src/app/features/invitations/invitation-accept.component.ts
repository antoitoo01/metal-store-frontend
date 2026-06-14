import { Component, inject, signal, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { OrganizationService } from '../organization/organization.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';

@Component({
  selector: 'app-invitation-accept',
  imports: [RouterLink, ButtonComponent],
  template: `
    <div class="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-950">
      <div class="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-900 dark:ring-1 dark:ring-gray-800">
        @if (!token()) {
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Enlace inválido</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">El enlace de invitación no es válido o está incompleto.</p>
          </div>
        } @else if (!authService.isAuthenticated()) {
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Invitación a organización</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Has sido invitado a una organización. Iniciá sesión o registrate para aceptar la invitación.
            </p>
            <div class="mt-6 flex flex-col gap-3">
              <a routerLink="/login" class="block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700">
                Iniciar sesión
              </a>
              <a routerLink="/register" class="block w-full rounded-lg border border-gray-300 px-4 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800">
                Registrarse
              </a>
            </div>
          </div>
        } @else if (accepted()) {
          <div class="text-center">
            <h1 class="text-xl font-bold text-green-700 dark:text-green-400">¡Invitación aceptada!</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Ya formas parte de la organización.</p>
            <a routerLink="/dashboard" class="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700">
              Ir al dashboard
            </a>
          </div>
        } @else if (declined()) {
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Invitación rechazada</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">Has rechazado la invitación a la organización.</p>
            <a routerLink="/dashboard" class="mt-6 block w-full rounded-lg bg-blue-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-blue-700">
              Ir al dashboard
            </a>
          </div>
        } @else if (declineMutation.isPending() || acceptMutation.isPending()) {
          <div class="text-center">
            <p class="text-gray-600 dark:text-gray-400">Procesando…</p>
          </div>
        } @else {
          <div class="text-center">
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">¿Aceptar invitación?</h1>
            <p class="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Has sido invitado a una organización. Aceptá la invitación para unirte o rechazala si no te interesa.
            </p>
            <div class="mt-6 flex flex-col gap-3">
              <app-button variant="primary" size="lg" [block]="true" (clicked)="accept()">Aceptar invitación</app-button>
              <app-button variant="outline" size="lg" [block]="true" (clicked)="decline()">Rechazar</app-button>
            </div>
          </div>
        }
      </div>
    </div>
  `,
})
export class InvitationAcceptComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  protected readonly authService = inject(AuthService);
  private readonly organizationService = inject(OrganizationService);
  private readonly notification = inject(NotificationService);

  protected readonly token = signal<string | null>(null);
  protected readonly accepted = signal(false);
  protected readonly declined = signal(false);

  protected readonly acceptMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (token) => firstValueFrom(this.organizationService.acceptInvitation(token)),
    onSuccess: () => {
      this.accepted.set(true);
      this.notification.success('Invitación aceptada correctamente');
    },
    onError: () => this.notification.error('Error al aceptar la invitación'),
  }));

  protected readonly declineMutation = injectMutation<void, Error, string>(() => ({
    mutationFn: (token) => firstValueFrom(this.organizationService.declineInvitation(token)),
    onSuccess: () => {
      this.declined.set(true);
      this.notification.success('Invitación rechazada');
    },
    onError: () => this.notification.error('Error al rechazar la invitación'),
  }));

  ngOnInit(): void {
    this.route.queryParamMap.subscribe((params) => {
      this.token.set(params.get('token'));
    });
  }

  protected accept(): void {
    const t = this.token();
    if (t) this.acceptMutation.mutate(t);
  }

  protected decline(): void {
    const t = this.token();
    if (t) this.declineMutation.mutate(t);
  }
}

import { Component, inject, signal, computed } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { injectMutation } from '@tanstack/angular-query-experimental';
import { OrganizationService } from './organization.service';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ButtonComponent } from '../../shared/components/button/button.component';
import { InvitationResponse } from '../../core/models/api.types';

@Component({
  selector: 'app-invitation-form',
  imports: [ButtonComponent],
  template: `
    <div>
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Nuevas invitaciones</h2>
        <button
          type="button"
          (click)="addRow()"
          class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
          + Agregar email
        </button>
      </div>

      <form (submit)="save($event)" class="space-y-3">
        @for (em of emails(); track i; let i = $index) {
          <div class="flex items-start gap-2">
            <div class="flex-1">
              <input
                [id]="'email-' + i"
                type="email"
                [value]="em"
                (input)="updateEmail(i, $any($event.target).value)"
                (blur)="touchEmail(i)"
                placeholder="email@ejemplo.com"
                class="block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
                [class.border-red-300]="!!emailErrors()[i]"
                [class.border-gray-300]="!emailErrors()[i]"
                [class.dark:border-red-500]="!!emailErrors()[i]"
                [class.dark:border-gray-600]="!emailErrors()[i]"
              />
              @if (emailErrors()[i]) {
                <p class="mt-1 text-sm text-red-600">{{ emailErrors()[i] }}</p>
              }
            </div>
            <button
              type="button"
              (click)="removeRow(i)"
              class="mt-1 rounded p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
              aria-label="Eliminar email">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        }

        @if (emails().length === 0) {
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Agregá al menos un email para invitar.
          </p>
        }

        <div class="flex flex-wrap items-center gap-3 pt-2">
          <app-button type="submit" [disabled]="!canSave() || saveMutation.isPending()">
            {{ saveMutation.isPending() ? 'Enviando…' : 'Invitar' }}
          </app-button>
          <button
            type="button"
            disabled
            title="Envío de email próximamente"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-400 opacity-50 cursor-not-allowed dark:border-gray-600 dark:text-gray-500">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Enviar email
          </button>
        </div>
      </form>

      @if (created().length > 0) {
        <div class="mt-6 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
          <h3 class="text-sm font-medium text-green-800 dark:text-green-300">
            {{ created().length }} invitaci{{ created().length === 1 ? 'ón' : 'ones' }} creada{{ created().length === 1 ? '' : 's' }}
          </h3>
          <ul class="mt-3 space-y-2">
            @for (inv of created(); track inv.token) {
              <li class="flex items-start gap-2 text-sm">
                <span class="mt-0.5 shrink-0 text-green-600 dark:text-green-400">✓</span>
                <div class="min-w-0 flex-1">
                  <p class="text-gray-700 dark:text-gray-300">{{ inv.email }}</p>
                  <div class="mt-1 flex items-center gap-2">
                    <code class="block truncate rounded bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-400">
                      {{ inv.link }}
                    </code>
                    <button
                      type="button"
                      (click)="copyLink(inv.link)"
                      class="shrink-0 text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                      title="Copiar enlace">
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                      </svg>
                    </button>
                  </div>
                </div>
              </li>
            }
          </ul>
        </div>
      }
    </div>
  `,
})
export class InvitationFormComponent {
  private readonly organizationService = inject(OrganizationService);
  private readonly authService = inject(AuthService);
  private readonly notification = inject(NotificationService);

  protected readonly emails = signal<string[]>(['']);
  protected readonly touched = signal<Set<number>>(new Set());
  private readonly emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  protected readonly emailErrors = computed(() => {
    return this.emails().map((em, i) => {
      if (!this.touched().has(i)) return undefined;
      if (!em) return 'El email es obligatorio';
      if (!this.emailRegex.test(em)) return 'Email inválido';
      return undefined;
    });
  });

  protected readonly canSave = computed(() => {
    const list = this.emails();
    return list.length > 0 && list.every((em) => em && this.emailRegex.test(em));
  });

  protected readonly saveMutation = injectMutation<InvitationResponse[], Error, string[]>(() => ({
    mutationFn: (emails) => {
      const orgId = this.authService.organizationId!;
      return firstValueFrom(this.organizationService.createInvitations(orgId, { emails }));
    },
    onSuccess: (result) => {
      this.created.set(result);
      this.emails.set(['']);
      this.touched.set(new Set());
      this.notification.success(`${result.length} invitacione${result.length === 1 ? '' : 's'} creada${result.length === 1 ? '' : 's'}`);
    },
  }));

  protected readonly created = signal<InvitationResponse[]>([]);

  protected addRow(): void {
    this.emails.update((e) => [...e, '']);
  }

  protected removeRow(index: number): void {
    this.emails.update((e) => e.filter((_, i) => i !== index));
    this.touched.update((t) => { t.delete(index); return new Set(t); });
  }

  protected updateEmail(index: number, value: string): void {
    this.emails.update((e) => e.map((v, i) => (i === index ? value : v)));
  }

  protected touchEmail(index: number): void {
    this.touched.update((t) => { t.add(index); return new Set(t); });
  }

  protected save(event: Event): void {
    event.preventDefault();
    const allTouched = new Set(this.emails().map((_, i) => i));
    this.touched.set(allTouched);
    if (!this.canSave()) return;
    this.saveMutation.mutate(this.emails().filter(Boolean));
  }

  protected copyLink(link: string): void {
    navigator.clipboard.writeText(link).then(() => {
      this.notification.success('Enlace copiado al portapapeles');
    });
  }
}

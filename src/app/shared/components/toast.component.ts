import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="fixed bottom-4 right-4 z-50 flex flex-col gap-2" role="status" aria-live="polite">
      @for (notif of notificationService.notifications(); track notif.id) {
        <div
          [class]="classes(notif.type)"
          role="alert">
          <span class="text-sm font-medium">{{ notif.message }}</span>
          <button
            type="button"
            (click)="notificationService.dismiss(notif.id)"
            class="ml-3 inline-flex shrink-0 items-center justify-center rounded-md p-1 hover:opacity-75 focus:outline-none focus:ring-2 focus:ring-white"
            aria-label="Cerrar">
            <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly notificationService = inject(NotificationService);

  protected classes(type: string): string {
    const base = 'flex items-center w-full max-w-sm rounded-lg px-4 py-3 shadow-lg pointer-events-auto animate-slide-up';
    const variants: Record<string, string> = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-600 text-white',
    };
    return `${base} ${variants[type] ?? variants['info']}`;
  }
}

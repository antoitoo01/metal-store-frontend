import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { NotificationService, NotificationType, ToastPosition } from '../../core/services/notification.service';

const PRIORITY_ORDER: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div [class]="containerClass()" role="status" aria-live="polite">
      @for (notif of visibleNotifications(); track notif.id) {
        <div
          [class]="toastClasses(notif.type, notif.removing)"
          role="alert"
          (mouseenter)="notificationService.pauseDismiss()"
          (mouseleave)="notificationService.resumeDismiss()"
          (click)="notificationService.dismiss(notif.id)">
          <div class="flex items-start gap-3">
            <span class="mt-0.5 shrink-0">@switch (notif.type) {
              @case ('success') {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" /></svg>
              }
              @case ('error') {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
              }
              @case ('warning') {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01M12 2l10 18H2L12 2z" /></svg>
              }
              @case ('info') {
                <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M12 2a10 10 0 100 20 10 10 0 000-20z" /></svg>
              }
            }</span>
            <div class="min-w-0 flex-1">
              <p class="text-sm font-medium">{{ notif.message }}</p>
              @if (notif.duration > 0 && !notif.removing) {
                <div class="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-white/30">
                  <div class="h-full rounded-full bg-white/70 transition-[width] linear" [style.width.%]="notif.removing ? 0 : 100" [style.animation-duration.ms]="notif.duration" style="animation-name: toast-shrink; animation-fill-mode: forwards;"></div>
                </div>
              }
            </div>
            <button
              type="button"
              (click)="$event.stopPropagation(); notificationService.dismiss(notif.id)"
              class="ml-2 inline-flex shrink-0 items-center justify-center rounded-md p-1 opacity-70 hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-white"
              aria-label="Cerrar">
              <svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  protected readonly notificationService = inject(NotificationService);

  protected readonly visibleNotifications = computed(() => {
    const all = this.notificationService.notifications();
    return [...all]
      .sort((a, b) => {
        const pa = PRIORITY_ORDER[a.priority] ?? 2;
        const pb = PRIORITY_ORDER[b.priority] ?? 2;
        return pa - pb;
      });
  });

  protected readonly containerClass = computed(() => {
    const base = 'fixed z-50 flex flex-col gap-2 pointer-events-none';
    const pos = this.notificationService.position();
    const positions: Record<ToastPosition, string> = {
      'top-right': 'top-4 right-4 items-end',
      'top-left': 'top-4 left-4 items-start',
      'bottom-right': 'bottom-4 right-4 items-end',
      'bottom-left': 'bottom-4 left-4 items-start',
      'top-center': 'top-4 left-1/2 -translate-x-1/2 items-center',
    };
    return `${base} ${positions[pos]}`;
  });

  protected toastClasses(type: NotificationType, removing?: boolean): string {
    const base = 'flex items-start w-full max-w-sm rounded-lg px-4 py-3 shadow-lg pointer-events-auto';
    const enterAnim = 'animate-slide-up';
    const exitAnim = removing ? 'animate-fade-out' : '';
    const variants: Record<string, string> = {
      success: 'bg-green-600 text-white',
      error: 'bg-red-600 text-white',
      warning: 'bg-yellow-500 text-white',
      info: 'bg-blue-600 text-white',
    };
    return `${base} ${enterAnim} ${exitAnim} ${variants[type] ?? variants['info']}`;
  }
}

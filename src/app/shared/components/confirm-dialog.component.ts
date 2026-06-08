import { Component, input, output, effect, computed } from '@angular/core';
import { ButtonComponent } from './button.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [ButtonComponent],
  template: `
    @if (visible()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        (click)="cancelled.emit()">
        <div
          class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800"
          (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ title() }}</h3>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ message() }}</p>
          <div class="mt-6 flex justify-end gap-3">
            <app-button variant="ghost" (clicked)="cancelled.emit()">{{ cancelLabel() }}</app-button>
            <app-button [variant]="confirmVariant()" (clicked)="confirmed.emit()">{{ confirmLabel() }}</app-button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConfirmDialogComponent {
  readonly visible = input(false);
  readonly title = input.required<string>();
  readonly message = input.required<string>();
  readonly confirmLabel = input('Confirmar');
  readonly cancelLabel = input('Cancelar');
  readonly variant = input<'danger' | 'warning' | 'default'>('default');

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  protected readonly confirmVariant = computed(() => {
    const map = { danger: 'danger' as const, warning: 'secondary' as const, default: 'primary' as const };
    return map[this.variant()];
  });

  constructor() {
    effect((onCleanup) => {
      if (this.visible()) {
        const handler = (e: KeyboardEvent) => {
          if (e.key === 'Escape') this.cancelled.emit();
        };
        document.addEventListener('keydown', handler);
        onCleanup(() => document.removeEventListener('keydown', handler));
      }
    });
  }
}

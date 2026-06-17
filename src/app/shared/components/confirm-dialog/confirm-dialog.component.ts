import { Component, input, output, effect, computed, viewChild, ElementRef } from '@angular/core';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-confirm-dialog',
  imports: [ButtonComponent],
  template: `
    <div
      class="fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-200"
      [class.visible]="visible()"
      [class.invisible]="!visible()"
      [class.opacity-100]="visible()"
      [class.opacity-0]="!visible()"
      (click)="cancelled.emit()">
      <div class="absolute inset-0 bg-black/50"></div>
      <div
        #dialogRef
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        class="mx-4 w-full max-w-md rounded-lg bg-white p-6 shadow-xl transition-all duration-200 dark:bg-gray-800"
        [class.scale-100]="visible()"
        [class.scale-95]="!visible()"
        [class.opacity-100]="visible()"
        [class.opacity-0]="!visible()"
        (click)="$event.stopPropagation()">
        <h3 id="confirm-dialog-title" class="text-lg font-semibold text-gray-900 dark:text-white">{{ title() }}</h3>
        <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">{{ message() }}</p>
        <div class="mt-6 flex justify-end gap-3">
          <app-button variant="ghost" (clicked)="cancelled.emit()">{{ cancelLabel() }}</app-button>
          <app-button [variant]="confirmVariant()" (clicked)="confirmed.emit()">{{ confirmLabel() }}</app-button>
        </div>
      </div>
    </div>
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

  private readonly dialogRef = viewChild<ElementRef<HTMLDivElement>>('dialogRef');

  protected readonly confirmVariant = computed(() => {
    const map = { danger: 'danger' as const, warning: 'secondary' as const, default: 'primary' as const };
    return map[this.variant()];
  });

  constructor() {
    effect((onCleanup) => {
      if (this.visible()) {
        const el = this.dialogRef()?.nativeElement;
        const focusable = el?.querySelectorAll<HTMLElement>('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const first = focusable?.[0];
        const last = focusable?.[focusable.length - 1];
        first?.focus();

        const handler = (e: KeyboardEvent) => {
          if (e.key === 'Escape') { this.cancelled.emit(); return; }
          if (e.key === 'Tab' && first && last) {
            if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
          }
        };
        document.addEventListener('keydown', handler);
        onCleanup(() => document.removeEventListener('keydown', handler));
      }
    });
  }
}

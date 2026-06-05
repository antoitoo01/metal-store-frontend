import { Component, input } from '@angular/core';

@Component({
  selector: 'app-input',
  standalone: true,
  template: `
    <div class="flex flex-col gap-1">
      @if (label()) {
        <label class="text-sm font-medium text-gray-700">{{ label() }}</label>
      }
      <input
        [type]="type()"
        [placeholder]="placeholder()"
        [disabled]="disabled()"
        [value]="value()"
        (input)="onInput($event)"
        [class]="inputClasses()"
      />
      @if (error()) {
        <p data-testid="input-error" class="text-sm text-red-600">{{ error() }}</p>
      }
    </div>
  `,
})
export class InputComponent {
  readonly label = input<string>();
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly disabled = input(false);
  readonly value = input<string>('');
  readonly error = input<string>();

  protected inputClasses(): string {
    const base = 'block w-full rounded-lg border px-3 py-2 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50';
    const border = this.error() ? 'border-red-300 focus:border-red-500' : 'border-gray-300 focus:border-primary-500';
    return `${base} ${border}`;
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    el.value = this.value();
  }
}

import { Component, input, forwardRef, signal, viewChild, ElementRef } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

@Component({
  selector: 'app-input',
  standalone: true,
  host: { style: 'display: block;' },
  template: `
    <div class="flex flex-col gap-1.5">
      @if (label()) {
        <label class="text-sm font-medium text-gray-700 dark:text-gray-300">{{ label() }}</label>
      }
      @switch (variant()) {
        @case ('select') {
          <select
            #inputRef
            [disabled]="isDisabled()"
            (change)="onChangeEvent($event)"
            (blur)="onBlur()"
            [class]="inputClasses()">
            <ng-content />
          </select>
        }
        @case ('textarea') {
          <textarea
            #inputRef
            [placeholder]="placeholder()"
            [disabled]="isDisabled()"
            (input)="onInput($event)"
            (blur)="onBlur()"
            rows="3"
            [class]="inputClasses()"></textarea>
        }
        @default {
          <input
            #inputRef
            [type]="type()"
            [placeholder]="placeholder()"
            [disabled]="isDisabled()"
            (input)="onInput($event)"
            (blur)="onBlur()"
            [class]="inputClasses()"
          />
        }
      }
      @if (error()) {
        <p data-testid="input-error" class="mt-1 text-sm text-red-600">{{ error() }}</p>
      }
    </div>
  `,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputComponent),
      multi: true,
    },
  ],
})
export class InputComponent implements ControlValueAccessor {
  readonly label = input<string>();
  readonly placeholder = input<string>('');
  readonly type = input<string>('text');
  readonly error = input<string>();
  readonly variant = input<'input' | 'select' | 'textarea'>('input');

  protected readonly isDisabled = signal(false);

  private readonly nativeInput = viewChild<ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>('inputRef');

  private onChange: (value: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(value: string): void {
    const el = this.nativeInput();
    if (el) {
      el.nativeElement.value = value ?? '';
    }
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled.set(isDisabled);
  }

  protected inputClasses(): string {
    const base = 'block w-full rounded-lg border px-4 py-2.5 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500';
    const border = this.error() ? 'border-red-300 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-primary-500 dark:border-gray-600';
    const disabled = this.isDisabled() ? 'cursor-not-allowed opacity-50' : '';
    return `${base} ${border} ${disabled}`;
  }

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement | HTMLTextAreaElement;
    this.onChange(el.value);
  }

  protected onChangeEvent(event: Event): void {
    const el = event.target as HTMLSelectElement;
    this.onChange(el.value);
  }

  protected onBlur(): void {
    this.onTouched();
  }
}

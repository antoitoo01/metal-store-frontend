import { Component, input, forwardRef, signal, computed, viewChild, ElementRef } from '@angular/core';
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
          <div class="relative">
            <input
              #inputRef
              [type]="effectiveType()"
              [placeholder]="placeholder()"
              [disabled]="isDisabled()"
              (input)="onInput($event)"
              (blur)="onBlur()"
              [class]="inputClasses()"
            />
            @if (type() === 'password') {
              <button type="button" (click)="togglePassword()" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300">
                @if (showPassword()) {
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                  </svg>
                } @else {
                  <svg class="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                }
              </button>
            }
          </div>
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
  protected readonly showPassword = signal(false);
  protected readonly effectiveType = computed(() => {
    if (this.type() === 'password' && this.showPassword()) return 'text';
    return this.type();
  });

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
    const padding = this.type() === 'password' ? 'pr-10' : '';
    const border = this.error() ? 'border-red-300 focus:border-red-500 dark:border-red-500' : 'border-gray-300 focus:border-primary-500 dark:border-gray-600';
    const disabled = this.isDisabled() ? 'cursor-not-allowed opacity-50' : '';
    return `${base} ${padding} ${border} ${disabled}`;
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

  protected togglePassword(): void {
    this.showPassword.update((v) => !v);
  }
}

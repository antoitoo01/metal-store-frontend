import { Component, input, output, signal, viewChild, ElementRef } from '@angular/core';

@Component({
  selector: 'app-search-input',
  template: `
    <div class="relative">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
        class="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500">
        <circle cx="11" cy="11" r="8" />
        <path d="m21 21-4.35-4.35" />
      </svg>
      <input
        #searchInput
        type="text"
        [placeholder]="placeholder()"
        (input)="onInput($event)"
        class="block w-full rounded-lg border border-gray-300 px-3 py-2 pl-10 pr-8 text-sm shadow-sm placeholder:text-gray-400 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500 dark:border-gray-600 dark:bg-slate-800 dark:text-white dark:placeholder:text-gray-500"
      />
      @if (value()) {
        <button
          data-testid="clear-btn"
          (click)="clear()"
          class="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="h-4 w-4">
            <path d="M18 6 6 18" /><path d="m6 6 12 12" />
          </svg>
        </button>
      }
    </div>
  `,
})
export class SearchInputComponent {
  readonly placeholder = input('Buscar…');
  readonly searchChange = output<string>();

  private readonly inputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  private readonly internalValue = signal('');
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  protected value = this.internalValue.asReadonly();

  protected onInput(event: Event): void {
    const el = event.target as HTMLInputElement;
    this.internalValue.set(el.value);
    this.debounce(el.value);
  }

  protected clear(): void {
    this.internalValue.set('');
    const el = this.inputRef()?.nativeElement;
    if (el) el.value = '';
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.searchChange.emit('');
  }

  private debounce(value: string): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      this.searchChange.emit(value);
    }, 300);
  }
}

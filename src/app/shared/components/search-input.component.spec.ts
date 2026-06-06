import { afterEach, beforeEach } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SearchInputComponent } from './search-input.component';

describe('SearchInputComponent', () => {
  let fixture: ComponentFixture<SearchInputComponent>;
  let component: SearchInputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchInputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(SearchInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders an input with the given placeholder', () => {
    fixture.componentRef.setInput('placeholder', 'Buscar cliente…');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Buscar cliente…');
  });

  it('emits search term after debounce delay', () => {
    vi.useFakeTimers();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'term';
    input.dispatchEvent(new Event('input'));

    expect(emitted).toEqual([]);

    vi.advanceTimersByTime(300);
    expect(emitted).toEqual(['term']);
    vi.useRealTimers();
  });

  it('shows clear button only when there is a value', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(fixture.nativeElement.querySelector('[data-testid="clear-btn"]')).toBeFalsy();

    input.value = 'text';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="clear-btn"]')).toBeTruthy();
  });

  it('clears the input and emits empty string when clear is clicked', () => {
    vi.useFakeTimers();
    const emitted: string[] = [];
    component.searchChange.subscribe((v) => emitted.push(v));

    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'text';
    input.dispatchEvent(new Event('input'));
    fixture.detectChanges();

    const clearBtn = fixture.nativeElement.querySelector('[data-testid="clear-btn"]') as HTMLButtonElement;
    clearBtn.click();
    fixture.detectChanges();

    expect(input.value).toBe('');
    expect(emitted).toContain('');
    vi.useRealTimers();
  });
});

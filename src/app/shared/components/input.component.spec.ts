import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    fixture.detectChanges();
  });

  it('renders an input element', () => {
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input).toBeTruthy();
  });

  it('renders label when provided', () => {
    fixture.componentRef.setInput('label', 'Nombre');
    fixture.detectChanges();
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label).toBeTruthy();
    expect(label.textContent).toContain('Nombre');
  });

  it('does not render label when not provided', () => {
    const label: HTMLLabelElement = fixture.nativeElement.querySelector('label');
    expect(label).toBeFalsy();
  });

  it('shows error message when error input is set', () => {
    fixture.componentRef.setInput('error', 'Campo requerido');
    fixture.detectChanges();
    const errorEl = fixture.nativeElement.querySelector('[data-testid="input-error"]');
    expect(errorEl).toBeTruthy();
    expect(errorEl.textContent).toContain('Campo requerido');
  });

  it('hides error message when error is not set', () => {
    const errorEl = fixture.nativeElement.querySelector('[data-testid="input-error"]');
    expect(errorEl).toBeFalsy();
  });

  it('disables input when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.disabled).toBe(true);
  });

  it('accepts placeholder input', () => {
    fixture.componentRef.setInput('placeholder', 'Buscar...');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.placeholder).toBe('Buscar...');
  });

  it('accepts type input', () => {
    fixture.componentRef.setInput('type', 'email');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.type).toBe('email');
  });
});

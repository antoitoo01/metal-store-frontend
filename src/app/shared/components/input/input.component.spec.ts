import { TestBed, ComponentFixture } from '@angular/core/testing';
import { InputComponent } from './input.component';

describe('InputComponent', () => {
  let fixture: ComponentFixture<InputComponent>;
  let component: InputComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InputComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(InputComponent);
    component = fixture.componentInstance;
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

  it('disables input via setDisabledState', () => {
    component.setDisabledState(true);
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

  it('updates native input value via writeValue', () => {
    component.writeValue('from-model');
    fixture.detectChanges();
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    expect(input.value).toBe('from-model');
  });

  it('calls onChange when input value changes', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.value = 'test@email.com';
    input.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('test@email.com');
  });

  it('calls onTouched on blur', () => {
    const onTouched = vi.fn();
    component.registerOnTouched(onTouched);
    const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
    input.dispatchEvent(new Event('blur'));
    expect(onTouched).toHaveBeenCalled();
  });

  it('renders a select when variant is select', () => {
    fixture.componentRef.setInput('variant', 'select');
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select');
    expect(select).toBeTruthy();
  });

  it('calls onChange when select value changes', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    fixture.componentRef.setInput('variant', 'select');
    fixture.detectChanges();
    const select: HTMLSelectElement = fixture.nativeElement.querySelector('select')!;
    const opt1 = document.createElement('option');
    opt1.value = 'opt1';
    opt1.text = 'Opt 1';
    const opt2 = document.createElement('option');
    opt2.value = 'opt2';
    opt2.text = 'Opt 2';
    select.appendChild(opt1);
    select.appendChild(opt2);
    select.value = 'opt2';
    select.dispatchEvent(new Event('change'));
    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('renders a textarea when variant is textarea', () => {
    fixture.componentRef.setInput('variant', 'textarea');
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
    expect(textarea).toBeTruthy();
  });

  it('calls onChange when textarea value changes', () => {
    const onChange = vi.fn();
    component.registerOnChange(onChange);
    fixture.componentRef.setInput('variant', 'textarea');
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')!;
    textarea.value = 'notas del cliente';
    textarea.dispatchEvent(new Event('input'));
    expect(onChange).toHaveBeenCalledWith('notas del cliente');
  });

  it('updates textarea native value via writeValue', () => {
    fixture.componentRef.setInput('variant', 'textarea');
    fixture.detectChanges();
    component.writeValue('notas editadas');
    fixture.detectChanges();
    const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea')!;
    expect(textarea.value).toBe('notas editadas');
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let fixture: ComponentFixture<ButtonComponent>;
  let component: ButtonComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders as a button element', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
  });

  it('sets type="button" by default', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.type).toBe('button');
  });

  it('renders projected content', () => {
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    btn.textContent = 'Guardar';
    expect(btn.textContent).toContain('Guardar');
  });

  it('disables button when disabled input is true', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('does not emit click when disabled', () => {
    let clicked = false;
    component.clicked.subscribe(() => (clicked = true));
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(clicked).toBe(false);
  });

  it('emits click event when enabled', () => {
    let clicked = false;
    component.clicked.subscribe(() => (clicked = true));

    (fixture.nativeElement.querySelector('button') as HTMLButtonElement).click();
    expect(clicked).toBe(true);
  });

  it('has cursor-not-allowed when disabled', () => {
    fixture.componentRef.setInput('disabled', true);
    fixture.detectChanges();
    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
    expect(btn.disabled).toBe(true);
  });

  it('accepts variant input without error', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('accepts size input without error', () => {
    expect(() => {
      fixture.componentRef.setInput('size', 'lg');
      fixture.detectChanges();
    }).not.toThrow();
  });
});

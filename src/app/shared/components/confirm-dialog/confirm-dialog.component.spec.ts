import { TestBed, ComponentFixture } from '@angular/core/testing';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('ConfirmDialogComponent', () => {
  let fixture: ComponentFixture<ConfirmDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConfirmDialogComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ConfirmDialogComponent);
    fixture.componentRef.setInput('title', 'Eliminar');
    fixture.componentRef.setInput('message', '¿Estás seguro?');
    fixture.detectChanges();
  });

  it('renders title and message when visible', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Eliminar');
    expect(text).toContain('¿Estás seguro?');
  });

  it('has invisible + opacity-0 classes when not visible', () => {
    fixture.componentRef.setInput('visible', false);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const overlay = host.firstElementChild!;
    expect(overlay.classList.contains('invisible')).toBe(true);
    expect(overlay.classList.contains('opacity-0')).toBe(true);
  });

  it('adds visible + opacity-100 + scale-100 classes when visible', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const overlay = host.firstElementChild!;
    expect(overlay.classList.contains('visible')).toBe(true);
    expect(overlay.classList.contains('opacity-100')).toBe(true);
    const card = overlay.querySelector('[class*="scale-"]')!;
    expect(card.classList.contains('scale-100')).toBe(true);
  });

  it('emits confirmed when confirm button clicked', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentRef.instance.confirmed.subscribe(spy);
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('app-button');
    for (const b of buttons) {
      if (b.textContent?.trim() === 'Confirmar') {
        b.querySelector('button')?.click();
        break;
      }
    }
    expect(spy).toHaveBeenCalled();
  });

  it('emits cancelled when cancel button clicked', () => {
    fixture.componentRef.setInput('visible', true);
    fixture.detectChanges();
    const spy = vi.fn();
    fixture.componentRef.instance.cancelled.subscribe(spy);
    const el = fixture.nativeElement as HTMLElement;
    const buttons = el.querySelectorAll('app-button');
    for (const b of buttons) {
      if (b.textContent?.trim() === 'Cancelar') {
        b.querySelector('button')?.click();
        break;
      }
    }
    expect(spy).toHaveBeenCalled();
  });
});

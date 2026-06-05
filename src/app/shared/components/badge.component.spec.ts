import { TestBed, ComponentFixture } from '@angular/core/testing';
import { BadgeComponent } from './badge.component';

describe('BadgeComponent', () => {
  let fixture: ComponentFixture<BadgeComponent>;
  let component: BadgeComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(BadgeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('renders a span element', () => {
    const el: HTMLSpanElement = fixture.nativeElement.querySelector('span');
    expect(el).toBeTruthy();
  });

  it('renders with default variant when none provided', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'default');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders with success variant', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'success');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders with warning variant', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'warning');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders with danger variant', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'danger');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders with info variant', () => {
    expect(() => {
      fixture.componentRef.setInput('variant', 'info');
      fixture.detectChanges();
    }).not.toThrow();
  });

  it('renders projected text content', () => {
    const el: HTMLSpanElement = fixture.nativeElement.querySelector('span');
    el.textContent = 'Activo';
    expect(el.textContent).toContain('Activo');
  });
});

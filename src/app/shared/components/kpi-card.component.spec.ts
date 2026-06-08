import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { KpiCardComponent } from './kpi-card.component';

describe('KpiCardComponent', () => {
  let fixture: ComponentFixture<KpiCardComponent>;

  function createComponent(label: string, value: number | null, route: string) {
    fixture = TestBed.createComponent(KpiCardComponent);
    fixture.componentRef.setInput('label', label);
    fixture.componentRef.setInput('value', value);
    fixture.componentRef.setInput('route', route);
    fixture.detectChanges();
    return fixture.componentInstance;
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiCardComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders label and value', () => {
    createComponent('Clientes', 42, '/clients');
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Clientes');
    expect(el.textContent).toContain('42');
  });

  it('renders "—" when value is null', () => {
    createComponent('Clientes', null, '/clients');
    expect(fixture.nativeElement.textContent).toContain('—');
  });

  it('renders 0 when value is 0', () => {
    createComponent('Clientes', 0, '/clients');
    expect(fixture.nativeElement.textContent).toContain('0');
  });

  it('renders a link to the route', () => {
    createComponent('Clientes', 5, '/clients');
    const link = fixture.nativeElement.querySelector('a');
    expect(link).toBeTruthy();
  });

  it('renders an icon container', () => {
    createComponent('Clientes', 5, '/clients');
    const icon = fixture.nativeElement.querySelector('[data-testid="kpi-icon"]');
    expect(icon).toBeTruthy();
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('renders the app title', () => {
    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('MetalStore');
  });

  it('renders all navigation items', () => {
    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a');
    const labels = Array.from(links).map((l) => l.textContent?.trim());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Catálogo');
    expect(labels).toContain('Inventario');
    expect(labels).toContain('Presupuestos');
    expect(labels).toContain('Facturación');
  });

  it('links to correct routes', () => {
    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a');
    const routes = Array.from(links).map((l) => l.getAttribute('href'));
    expect(routes).toContain('/dashboard');
    expect(routes).toContain('/clients');
    expect(routes).toContain('/catalog');
    expect(routes).toContain('/inventory');
    expect(routes).toContain('/quotes');
    expect(routes).toContain('/billing');
  });

  it('has routerLinkActive directive on nav items', () => {
    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a[routerlinkactive]');
    // All nav links (excluding the brand link) should have routerLinkActive
    expect(links.length).toBeGreaterThanOrEqual(6);
  });
});

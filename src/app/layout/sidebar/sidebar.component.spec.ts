import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  let fixture: ComponentFixture<SidebarComponent>;

  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();
  });

  it('renders the app logo and title', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('MetalStore');
  });

  it('renders all navigation items from config', () => {
    const nav = fixture.nativeElement.querySelector('nav');
    const links = nav.querySelectorAll('a') as NodeListOf<HTMLElement>;
    const labels = Array.from(links).map((l) => l.textContent?.trim());
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Clientes');
    expect(labels).toContain('Catálogo');
    expect(labels).toContain('Inventario');
    expect(labels).toContain('Presupuestos');
    expect(labels).toContain('Facturación');
    expect(labels).toContain('Usuarios');
  });

  it('is expanded by default', () => {
    const aside = fixture.nativeElement.querySelector('aside');
    expect(aside.classList.contains('w-48')).toBe(true);
    expect(aside.classList.contains('w-20')).toBe(false);
  });

  it('toggles collapsed state when button is clicked', () => {
    const btn = fixture.nativeElement.querySelector('button');
    btn.click();
    fixture.detectChanges();
    const aside = fixture.nativeElement.querySelector('aside');
    expect(aside.classList.contains('w-20')).toBe(true);
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { Component } from '@angular/core';
import { BreadcrumbComponent } from './breadcrumb.component';

@Component({ template: '', standalone: true })
class DummyComponent {}

describe('BreadcrumbComponent', () => {
  let fixture: ComponentFixture<BreadcrumbComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BreadcrumbComponent],
      providers: [
        provideRouter([
          { path: 'clients', component: DummyComponent },
          { path: 'catalog/profiles', component: DummyComponent },
          { path: '**', component: DummyComponent },
        ]),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BreadcrumbComponent);
    fixture.detectChanges();
  });

  it('shows Inicio as first element', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/clients']);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Inicio');
  });

  it('shows breadcrumb label mapped from URL', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/clients']);
    fixture.detectChanges();

    const el: HTMLElement = fixture.nativeElement;
    expect(el.textContent).toContain('Clientes');
  });

  it('renders last breadcrumb as plain text (not a link)', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/clients']);
    fixture.detectChanges();

    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a');
    const lastCrumbIsLink = Array.from(links).some((l) => l.textContent?.trim() === 'Clientes');
    expect(lastCrumbIsLink).toBe(false);
  });

  it('renders intermediate breadcrumbs as links', async () => {
    const router = TestBed.inject(Router);
    await router.navigate(['/catalog/profiles']);
    fixture.detectChanges();

    const links: HTMLAnchorElement[] = fixture.nativeElement.querySelectorAll('a');
    const linkLabels = Array.from(links).map((l) => l.textContent?.trim());
    expect(linkLabels).toContain('Catálogo');
  });
});

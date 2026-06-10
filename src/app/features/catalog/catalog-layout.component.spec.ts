import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CatalogLayoutComponent } from './catalog-layout.component';

describe('CatalogLayoutComponent', () => {
  let fixture: ComponentFixture<CatalogLayoutComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CatalogLayoutComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogLayoutComponent);
    fixture.detectChanges();
  });

  it('renders title', () => {
    expect(fixture.nativeElement.textContent).toContain('Catálogo');
  });

  it('renders all 4 tab links', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Perfiles');
    expect(text).toContain('Artículos');
    expect(text).toContain('Familias');
    expect(text).toContain('Tipos de artículo');
  });

  it('has routerLink on each tab', () => {
    const links = fixture.nativeElement.querySelectorAll('a');
    expect(links.length).toBe(4);
    expect(links[0].getAttribute('href')).toBe('/catalog/profiles');
    expect(links[1].getAttribute('href')).toBe('/catalog/items');
    expect(links[2].getAttribute('href')).toBe('/catalog/families');
    expect(links[3].getAttribute('href')).toBe('/catalog/item-types');
  });
});

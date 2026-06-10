import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { CatalogItemDetailComponent } from './catalog-item-detail.component';
import { mockCatalogItem } from '../testing/mock-factories';

describe('CatalogItemDetailComponent', () => {
  let fixture: ComponentFixture<CatalogItemDetailComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['catalog-item', 'item-1'], mockCatalogItem({ designation: 'PL 20x2000', material: 'S355JR', estimatedPriceKg: 2.0 }));

    await TestBed.configureTestingModule({
      imports: [CatalogItemDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'item-1' } } } },
        provideTanStackQuery(queryClient),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogItemDetailComponent);
    fixture.detectChanges();
  });

  it('renders item designation', () => {
    expect(fixture.nativeElement.textContent).toContain('PL 20x2000');
  });

  it('renders item material', () => {
    expect(fixture.nativeElement.textContent).toContain('S355JR');
  });

  it('renders estimated price', () => {
    expect(fixture.nativeElement.textContent).toMatch(/2.*€/);
  });

  it('renders image upload section', () => {
    expect(fixture.nativeElement.textContent).toContain('Sin imagen');
    expect(fixture.nativeElement.textContent).toContain('Subir imagen');
  });

  it('renders back link', () => {
    expect(fixture.nativeElement.textContent).toContain('Volver a artículos');
  });
});

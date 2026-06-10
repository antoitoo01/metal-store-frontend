import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { CatalogProfileDetailComponent } from './catalog-profile-detail.component';
import { mockCatalogProfile } from '../testing/mock-factories';

describe('CatalogProfileDetailComponent', () => {
  let fixture: ComponentFixture<CatalogProfileDetailComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['catalog-profile', 'profile-1'], mockCatalogProfile({ designation: 'IPE 300', weightKgM: 42.2, areaCm2: 53.8 }));

    await TestBed.configureTestingModule({
      imports: [CatalogProfileDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'profile-1' } } } },
        provideTanStackQuery(queryClient),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogProfileDetailComponent);
    fixture.detectChanges();
  });

  it('renders profile designation', () => {
    expect(fixture.nativeElement.textContent).toContain('IPE 300');
  });

  it('renders profile weight', () => {
    expect(fixture.nativeElement.textContent).toContain('42.2');
  });

  it('renders profile area', () => {
    expect(fixture.nativeElement.textContent).toContain('53.8');
  });

  it('renders image upload section', () => {
    expect(fixture.nativeElement.textContent).toContain('Sin imagen');
    expect(fixture.nativeElement.textContent).toContain('Subir imagen');
  });

  it('renders back link', () => {
    expect(fixture.nativeElement.textContent).toContain('Volver a perfiles');
  });
});

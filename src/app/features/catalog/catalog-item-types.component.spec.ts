import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { CatalogItemTypesComponent } from './catalog-item-types.component';
import { CatalogService } from './catalog.service';
import { mockType, mockPage } from '../testing/mock-factories';

describe('CatalogItemTypesComponent', () => {
  let fixture: ComponentFixture<CatalogItemTypesComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['catalog-item-types'], mockPage([mockType({ name: 'PLATE' }), mockType({ name: 'PROFILE' })]));

    await TestBed.configureTestingModule({
      imports: [CatalogItemTypesComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), CatalogService],
    }).compileComponents();

    fixture = TestBed.createComponent(CatalogItemTypesComponent);
    fixture.detectChanges();
  });

  it('renders type list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PLATE');
    expect(text).toContain('PROFILE');
  });

  it('renders create input and button', () => {
    expect(fixture.nativeElement.querySelector('input[placeholder="Nuevo tipo…"]')).toBeTruthy();
    expect(fixture.nativeElement.textContent).toContain('Crear');
  });

  it('renders delete buttons', () => {
    const deleteBtns = fixture.nativeElement.querySelectorAll('app-button') as NodeListOf<HTMLElement>;
    const deleteButtons = Array.from(deleteBtns).filter(b => b.textContent?.trim() === 'Eliminar');
    expect(deleteButtons.length).toBe(2);
  });
});

import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { PriceListComponent } from './price-list.component';
import { BillingService } from './billing.service';
import { mockPrice, mockPage } from '../testing/mock-factories';

describe('PriceListComponent', () => {
  let fixture: ComponentFixture<PriceListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['prices', { page: 0, size: 20, q: undefined, sort: undefined }], mockPage([mockPrice({ unitPrice: 2.5 }), mockPrice({ unitPrice: 3.75 })]));

    await TestBed.configureTestingModule({
      imports: [PriceListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), BillingService],
    }).compileComponents();

    fixture = TestBed.createComponent(PriceListComponent);
    fixture.detectChanges();
  });

  it('renders price list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('2.50');
    expect(text).toContain('3.75');
  });

  it('renders create price form', () => {
    expect(fixture.nativeElement.textContent).toContain('Nuevo precio');
  });

  it('renders delete buttons', () => {
    const deleteBtns = fixture.nativeElement.querySelectorAll('app-button') as NodeListOf<HTMLElement>;
    const deleteButtons = Array.from(deleteBtns).filter(b => b.textContent?.trim() === 'Eliminar');
    expect(deleteButtons.length).toBe(2);
  });
});

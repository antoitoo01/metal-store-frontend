import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { QuoteDetailComponent } from './quote-detail.component';
import { QuoteService } from './quote.service';
import { mockQuote, mockQuoteLine } from '../testing/mock-factories';

describe('QuoteDetailComponent', () => {
  let fixture: ComponentFixture<QuoteDetailComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['quote', 'test-id'], mockQuote({ quoteNumber: 'PRES-001', status: 'DRAFT' }));
    queryClient.setQueryData(['quote-lines', 'test-id'], [mockQuoteLine({ lineNumber: 1, description: 'Viga IPE 200', quantity: 3, unitPrice: 85 })]);

    await TestBed.configureTestingModule({
      imports: [QuoteDetailComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { params: { id: 'test-id' } } } },
        provideTanStackQuery(queryClient),
        QuoteService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteDetailComponent);
    fixture.detectChanges();
  });

  it('renders quote number', () => {
    expect(fixture.nativeElement.textContent).toContain('PRES-001');
  });

  it('renders status badge', () => {
    expect(fixture.nativeElement.textContent).toContain('DRAFT');
  });

  it('renders quote lines', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Viga IPE 200');
    expect(text).toContain('3');
    expect(text).toContain('85');
  });

  it('shows action buttons for DRAFT status', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Emitir');
    expect(text).toContain('Cancelar');
  });

  it('shows add line form for DRAFT', () => {
    expect(fixture.nativeElement.textContent).toContain('Añadir línea');
  });

  it('shows export PDF button for DRAFT', () => {
    expect(fixture.nativeElement.textContent).toContain('Exportar PDF');
  });
});

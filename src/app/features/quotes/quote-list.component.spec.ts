import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { QuoteListComponent } from './quote-list.component';
import { QuoteService } from './quote.service';
import { mockQuote, mockPage } from '../testing/mock-factories';

describe('QuoteListComponent', () => {
  let fixture: ComponentFixture<QuoteListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['quotes', { page: 0, q: '' }], mockPage([mockQuote({ quoteNumber: 'PRES-001', customerName: 'ACME', total: 1500 }), mockQuote({ quoteNumber: 'PRES-002', status: 'ISSUED', total: 2500 })]));

    await TestBed.configureTestingModule({
      imports: [QuoteListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), QuoteService],
    }).compileComponents();

    fixture = TestBed.createComponent(QuoteListComponent);
    fixture.detectChanges();
  });

  it('renders quote numbers', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('PRES-001');
    expect(text).toContain('PRES-002');
  });

  it('renders customer names', () => {
    expect(fixture.nativeElement.textContent).toContain('ACME');
  });

  it('renders totals', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1500.00');
    expect(text).toContain('2500.00');
  });

  it('renders status badges', () => {
    expect(fixture.nativeElement.textContent).toContain('DRAFT');
    expect(fixture.nativeElement.textContent).toContain('ISSUED');
  });

  it('renders view links', () => {
    const viewLinks = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const filtered = Array.from(viewLinks).filter(l => l.textContent?.trim() === 'Ver');
    expect(filtered.length).toBe(2);
  });
});

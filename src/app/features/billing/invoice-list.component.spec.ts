import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { InvoiceListComponent } from './invoice-list.component';
import { BillingService } from './billing.service';
import { mockInvoice, mockPage } from '../testing/mock-factories';

describe('InvoiceListComponent', () => {
  let fixture: ComponentFixture<InvoiceListComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['invoices', { page: 0, q: '' }], mockPage([mockInvoice({ invoiceNumber: 'FAC-001', customerName: 'ACME', total: 1200 }), mockInvoice({ invoiceNumber: 'FAC-002', status: 'ISSUED', total: 3400 })]));

    await TestBed.configureTestingModule({
      imports: [InvoiceListComponent],
      providers: [provideRouter([]), provideTanStackQuery(queryClient), BillingService],
    }).compileComponents();

    fixture = TestBed.createComponent(InvoiceListComponent);
    fixture.detectChanges();
  });

  it('renders invoice list', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('FAC-001');
    expect(text).toContain('FAC-002');
    expect(text).toContain('ACME');
  });

  it('renders totals', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('1200.00');
    expect(text).toContain('3400.00');
  });

  it('renders status badges', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('DRAFT');
    expect(text).toContain('ISSUED');
  });

  it('renders view links', () => {
    const viewLinks = fixture.nativeElement.querySelectorAll('a') as NodeListOf<HTMLAnchorElement>;
    const filtered = Array.from(viewLinks).filter(l => l.textContent?.trim() === 'Ver');
    expect(filtered.length).toBe(2);
  });
});

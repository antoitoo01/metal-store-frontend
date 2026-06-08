import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';
import { DashboardComponent } from './dashboard.component';
import { DashboardService } from '../../core/services/dashboard.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';
import { QuoteResponse, InvoiceResponse } from '../../core/models/api.types';

function quote(overrides?: Partial<QuoteResponse>): QuoteResponse {
  return { id: '1', quoteNumber: 'PRES-001', tenantId: '', clientId: null, customerName: 'Test', customerVat: null, customerAddress: null, issueDate: '2026-06-01', validUntil: null, status: 'DRAFT', subtotal: 100, vatTotal: 21, total: 121, notes: null, ...overrides };
}

function invoice(overrides?: Partial<InvoiceResponse>): InvoiceResponse {
  return { id: '1', invoiceNumber: 'FAC-001', tenantId: '', customerName: 'Test', customerVat: null, customerAddress: null, issueDate: '2026-06-01', dueDate: null, status: 'ISSUED', subtotal: 100, vatTotal: 21, total: 121, notes: null, ...overrides };
}

describe('DashboardComponent', () => {
  let fixture: ComponentFixture<DashboardComponent>;
  let queryClient: QueryClient;

  beforeEach(async () => {
    queryClient = new QueryClient();

    queryClient.setQueryData(['dashboard/clients'], 42);
    queryClient.setQueryData(['dashboard/inventory'], 17);
    queryClient.setQueryData(['dashboard/quotes'], 8);
    queryClient.setQueryData(['dashboard/invoices'], 23);
    queryClient.setQueryData(['dashboard/recent-quotes'], [quote()]);
    queryClient.setQueryData(['dashboard/recent-invoices'], [invoice()]);

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        provideTanStackQuery(queryClient),
        DashboardService,
        QuoteService,
        BillingService,
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    fixture.detectChanges();
  });

  it('renders 4 KPI cards with correct counts', () => {
    const text = fixture.nativeElement.textContent;
    expect(text).toContain('Clientes');
    expect(text).toContain('42');
    expect(text).toContain('Inventario');
    expect(text).toContain('17');
    expect(text).toContain('Presupuestos');
    expect(text).toContain('8');
    expect(text).toContain('Facturas');
    expect(text).toContain('23');
  });

  it('shows recent quotes section', () => {
    expect(fixture.nativeElement.textContent).toContain('PRES-001');
  });

  it('shows recent invoices section', () => {
    expect(fixture.nativeElement.textContent).toContain('FAC-001');
  });
});

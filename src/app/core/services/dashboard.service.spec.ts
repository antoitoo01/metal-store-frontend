import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { ClientService } from '../../features/clients/client.service';
import { InventoryService } from '../../features/inventory/inventory.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';
import { of } from 'rxjs';

function page(totalElements: number, content: unknown[] = []) {
  return { content, totalElements, totalPages: 1, size: 1, number: 0, first: true, last: true, empty: totalElements === 0 };
}

describe('DashboardService', () => {
  let service: DashboardService;
  let clientService: { list: ReturnType<typeof vi.fn> };
  let inventoryService: { list: ReturnType<typeof vi.fn> };
  let quoteService: { list: ReturnType<typeof vi.fn> };
  let billingService: { invoices: ReturnType<typeof vi.fn> };

  beforeEach(() => {
    clientService = { list: vi.fn() };
    inventoryService = { list: vi.fn() };
    quoteService = { list: vi.fn() };
    billingService = { invoices: vi.fn() };

    TestBed.configureTestingModule({
      providers: [
        DashboardService,
        { provide: ClientService, useValue: clientService },
        { provide: InventoryService, useValue: inventoryService },
        { provide: QuoteService, useValue: quoteService },
        { provide: BillingService, useValue: billingService },
      ],
    });

    service = TestBed.inject(DashboardService);
    clientService.list.mockReturnValue(of(page(42)));
    inventoryService.list.mockReturnValue(of(page(17)));
    quoteService.list.mockReturnValue(of(page(8)));
    billingService.invoices.mockReturnValue(of(page(23)));
  });

  it('returns combined dashboard data from all services', async () => {
    const data = await service.getDashboardData();
    expect(data.clientCount).toBe(42);
    expect(data.inventoryCount).toBe(17);
    expect(data.quoteCount).toBe(8);
    expect(data.invoiceCount).toBe(23);
    expect(clientService.list).toHaveBeenCalledWith(0, 1);
    expect(inventoryService.list).toHaveBeenCalledWith(0, 1);
    expect(quoteService.list).toHaveBeenCalledWith(0, 5);
    expect(billingService.invoices).toHaveBeenCalledWith(0, 5);
  });

  it('extracts recent quotes and invoices from content', async () => {
    const mockQuote = { id: 'q1', quoteNumber: 'PRES-001' } as any;
    const mockInvoice = { id: 'i1', invoiceNumber: 'FAC-001' } as any;
    clientService.list.mockReturnValue(of(page(0)));
    inventoryService.list.mockReturnValue(of(page(0)));
    quoteService.list.mockReturnValue(of(page(1, [mockQuote])));
    billingService.invoices.mockReturnValue(of(page(1, [mockInvoice])));

    const data = await service.getDashboardData();
    expect(data.recentQuotes).toEqual([mockQuote]);
    expect(data.recentInvoices).toEqual([mockInvoice]);
  });
});

import { TestBed } from '@angular/core/testing';
import { DashboardService } from './dashboard.service';
import { ClientService } from '../../features/clients/client.service';
import { InventoryService } from '../../features/inventory/inventory.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';
import { of } from 'rxjs';

function page(totalElements: number) {
  return { content: [], totalElements, totalPages: 1, size: 1, number: 0, first: true, last: true, empty: totalElements === 0 };
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

  it('returns client count from totalElements', () => {
    service.getClientCount().subscribe((count) => {
      expect(count).toBe(42);
    });
    expect(clientService.list).toHaveBeenCalledWith(0, 1);
  });

  it('returns inventory count from totalElements', () => {
    service.getInventoryCount().subscribe((count) => {
      expect(count).toBe(17);
    });
    expect(inventoryService.list).toHaveBeenCalledWith(0, 1);
  });

  it('returns quote count from totalElements', () => {
    service.getQuoteCount().subscribe((count) => {
      expect(count).toBe(8);
    });
    expect(quoteService.list).toHaveBeenCalledWith(0, 1);
  });

  it('returns invoice count from totalElements', () => {
    service.getInvoiceCount().subscribe((count) => {
      expect(count).toBe(23);
    });
    expect(billingService.invoices).toHaveBeenCalledWith(0, 1);
  });
});

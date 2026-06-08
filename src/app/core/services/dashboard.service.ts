import { Injectable, inject } from '@angular/core';
import { map } from 'rxjs/operators';
import { ClientService } from '../../features/clients/client.service';
import { InventoryService } from '../../features/inventory/inventory.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly clientService = inject(ClientService);
  private readonly inventoryService = inject(InventoryService);
  private readonly quoteService = inject(QuoteService);
  private readonly billingService = inject(BillingService);

  getClientCount() {
    return this.clientService.list(0, 1).pipe(map((p) => p.totalElements));
  }

  getInventoryCount() {
    return this.inventoryService.list(0, 1).pipe(map((p) => p.totalElements));
  }

  getQuoteCount() {
    return this.quoteService.list(0, 1).pipe(map((p) => p.totalElements));
  }

  getInvoiceCount() {
    return this.billingService.invoices(0, 1).pipe(map((p) => p.totalElements));
  }

  getRecentQuotes() {
    return this.quoteService.list(0, 5).pipe(map((p) => p.content));
  }

  getRecentInvoices() {
    return this.billingService.invoices(0, 5).pipe(map((p) => p.content));
  }
}

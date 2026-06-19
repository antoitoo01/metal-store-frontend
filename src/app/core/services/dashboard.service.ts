import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ClientService } from '../../features/clients/client.service';
import { InventoryService } from '../../features/inventory/inventory.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';
import { QuoteResponse, InvoiceResponse } from '../models/api.types';

export interface DashboardData {
  clientCount: number;
  inventoryCount: number;
  quoteCount: number;
  invoiceCount: number;
  recentQuotes: QuoteResponse[];
  recentInvoices: InvoiceResponse[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly clientService = inject(ClientService);
  private readonly inventoryService = inject(InventoryService);
  private readonly quoteService = inject(QuoteService);
  private readonly billingService = inject(BillingService);

  async getDashboardData(): Promise<DashboardData> {
    const [clientPage, inventoryPage, quotePage, invoicePage] = await Promise.all([
      firstValueFrom(this.clientService.list(0, 1)),
      firstValueFrom(this.inventoryService.list(0, 1)),
      firstValueFrom(this.quoteService.list(0, 5)),
      firstValueFrom(this.billingService.invoices(0, 5)),
    ]);

    return {
      clientCount: clientPage.totalElements,
      inventoryCount: inventoryPage.totalElements,
      quoteCount: quotePage.totalElements,
      invoiceCount: invoicePage.totalElements,
      recentQuotes: quotePage.content,
      recentInvoices: invoicePage.content,
    };
  }
}

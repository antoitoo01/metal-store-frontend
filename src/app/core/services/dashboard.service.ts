import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { ClientService } from '../../features/clients/client.service';
import { InventoryService } from '../../features/inventory/inventory.service';
import { QuoteService } from '../../features/quotes/quote.service';
import { BillingService } from '../../features/billing/billing.service';
import { SupplierService } from '../../features/suppliers/supplier.service';
import { PurchaseOrderService } from '../../features/purchase-orders/purchase-order.service';
import { InboundService } from '../../features/inbound/inbound.service';
import { OutboundService } from '../../features/outbound/outbound.service';
import { QuoteResponse, InvoiceResponse } from '../models/api.types';

export interface DashboardData {
  clientCount: number;
  inventoryCount: number;
  quoteCount: number;
  invoiceCount: number;
  supplierCount: number;
  poCount: number;
  inboundCount: number;
  outboundCount: number;
  recentQuotes: QuoteResponse[];
  recentInvoices: InvoiceResponse[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly clientService = inject(ClientService);
  private readonly inventoryService = inject(InventoryService);
  private readonly quoteService = inject(QuoteService);
  private readonly billingService = inject(BillingService);
  private readonly supplierService = inject(SupplierService);
  private readonly poService = inject(PurchaseOrderService);
  private readonly inboundService = inject(InboundService);
  private readonly outboundService = inject(OutboundService);

  async getDashboardData(): Promise<DashboardData> {
    const [clientPage, inventoryPage, quotePage, invoicePage, supplierPage, poPage, inboundPage, outboundPage] = await Promise.all([
      firstValueFrom(this.clientService.list(0, 1)),
      firstValueFrom(this.inventoryService.list(0, 1)),
      firstValueFrom(this.quoteService.list(0, 5)),
      firstValueFrom(this.billingService.invoices(0, 5)),
      firstValueFrom(this.supplierService.list(0, 1)),
      firstValueFrom(this.poService.list(0, 1)),
      firstValueFrom(this.inboundService.list(0, 1)),
      firstValueFrom(this.outboundService.list(0, 1)),
    ]);

    return {
      clientCount: clientPage.totalElements,
      inventoryCount: inventoryPage.totalElements,
      quoteCount: quotePage.totalElements,
      invoiceCount: invoicePage.totalElements,
      supplierCount: supplierPage.totalElements,
      poCount: poPage.totalElements,
      inboundCount: inboundPage.totalElements,
      outboundCount: outboundPage.totalElements,
      recentQuotes: quotePage.content,
      recentInvoices: invoicePage.content,
    };
  }
}

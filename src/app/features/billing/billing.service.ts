import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InvoiceResponse, InvoiceLineResponse, PriceResponse, UpsertPriceRequest, CreateInvoiceLineRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/billing`;

  prices(page = 0, size = 20, q?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<PriceResponse>>(`${this.api}/prices`, { params });
  }

  createPrice(body: UpsertPriceRequest) {
    return this.http.post<PriceResponse>(`${this.api}/prices`, body);
  }

  deletePrice(id: string) {
    return this.http.delete<void>(`${this.api}/prices/${id}`);
  }

  updatePrice(id: string, body: Partial<{ unitPrice: number; validFrom: string | null; validTo: string | null; notes: string | null }>) {
    return this.http.put<PriceResponse>(`${this.api}/prices/${id}`, body);
  }

  invoices(page = 0, size = 20, q?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<InvoiceResponse>>(`${this.api}/invoices`, { params });
  }

  getInvoice(id: string) {
    return this.http.get<InvoiceResponse>(`${this.api}/invoices/${id}`);
  }

  createInvoice(customerName?: string, customerVat?: string) {
    let params = new HttpParams();
    if (customerName) params = params.set('customerName', customerName);
    if (customerVat) params = params.set('customerVat', customerVat);
    return this.http.post<InvoiceResponse>(`${this.api}/invoices`, {}, { params });
  }

  updateInvoice(id: string, body: Partial<{ customerName: string | null; customerVat: string | null; customerAddress: string | null; notes: string | null }>) {
    return this.http.put<InvoiceResponse>(`${this.api}/invoices/${id}`, body);
  }

  getInvoiceLines(id: string) {
    return this.http.get<InvoiceLineResponse[]>(`${this.api}/invoices/${id}/lines`);
  }

  addInvoiceLine(invoiceId: string, body: CreateInvoiceLineRequest) {
    return this.http.post<InvoiceLineResponse>(`${this.api}/invoices/${invoiceId}/lines`, body);
  }

  removeInvoiceLine(invoiceId: string, lineId: string) {
    return this.http.delete<void>(`${this.api}/invoices/${invoiceId}/lines/${lineId}`);
  }

  issue(id: string) {
    return this.http.post<InvoiceResponse>(`${this.api}/invoices/${id}/issue`, {});
  }

  pay(id: string) {
    return this.http.post<InvoiceResponse>(`${this.api}/invoices/${id}/pay`, {});
  }

  cancel(id: string) {
    return this.http.post<InvoiceResponse>(`${this.api}/invoices/${id}/cancel`, {});
  }
}

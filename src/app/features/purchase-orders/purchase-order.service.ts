import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { PurchaseOrderResponse, PurchaseOrderLineResponse, CreatePurchaseOrderRequest, CreatePurchaseOrderLineRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/purchase-orders`;

  list(page = 0, size = 20, q?: string, status?: string, supplierId?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (status) params = params.set('status', status);
    if (supplierId) params = params.set('supplierId', supplierId);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<PurchaseOrderResponse>>(this.apiUrl, { params });
  }

  get(id: string) {
    return this.http.get<PurchaseOrderResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreatePurchaseOrderRequest) {
    return this.http.post<PurchaseOrderResponse>(this.apiUrl, body);
  }

  update(id: string, body: Partial<{ supplierName: string | null; supplierVat: string | null; supplierAddress: string | null; expectedDate: string | null; notes: string | null }>) {
    return this.http.put<PurchaseOrderResponse>(`${this.apiUrl}/${id}`, body);
  }

  getLines(id: string) {
    return this.http.get<PurchaseOrderLineResponse[]>(`${this.apiUrl}/${id}/lines`);
  }

  addLine(poId: string, body: CreatePurchaseOrderLineRequest) {
    return this.http.post<PurchaseOrderLineResponse>(`${this.apiUrl}/${poId}/lines`, body);
  }

  removeLine(poId: string, lineId: string) {
    return this.http.delete<void>(`${this.apiUrl}/${poId}/lines/${lineId}`);
  }

  issue(id: string) {
    return this.http.post<PurchaseOrderResponse>(`${this.apiUrl}/${id}/issue`, {});
  }

  receive(id: string) {
    return this.http.post<PurchaseOrderResponse>(`${this.apiUrl}/${id}/receive`, {});
  }

  cancel(id: string) {
    return this.http.post<PurchaseOrderResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }
}

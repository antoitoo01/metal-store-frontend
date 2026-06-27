import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InboundDNResponse, InboundDNLineResponse, CreateInboundDNRequest, CreateInboundDNLineRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class InboundService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/inbound-delivery-notes`;

  list(page = 0, size = 20, q?: string, status?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (status) params = params.set('status', status);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<InboundDNResponse>>(this.apiUrl, { params });
  }

  get(id: string) {
    return this.http.get<InboundDNResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateInboundDNRequest) {
    return this.http.post<InboundDNResponse>(this.apiUrl, body);
  }

  getLines(id: string) {
    return this.http.get<InboundDNLineResponse[]>(`${this.apiUrl}/${id}/lines`);
  }

  addLine(dnId: string, body: CreateInboundDNLineRequest) {
    return this.http.post<InboundDNLineResponse>(`${this.apiUrl}/${dnId}/lines`, body);
  }

  removeLine(dnId: string, lineId: string) {
    return this.http.delete<void>(`${this.apiUrl}/${dnId}/lines/${lineId}`);
  }

  confirm(id: string) {
    return this.http.post<InboundDNResponse>(`${this.apiUrl}/${id}/confirm`, {});
  }

  cancel(id: string) {
    return this.http.post<InboundDNResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }
}

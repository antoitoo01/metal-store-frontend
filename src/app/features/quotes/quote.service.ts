import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { QuoteResponse, QuoteLineResponse, CreateQuoteRequest, CreateQuoteLineRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/quotes`;

  list(page = 0, size = 20, q?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    return this.http.get<Page<QuoteResponse>>(this.apiUrl, { params });
  }

  get(id: string) {
    return this.http.get<QuoteResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateQuoteRequest) {
    return this.http.post<QuoteResponse>(this.apiUrl, body);
  }

  getLines(id: string) {
    return this.http.get<QuoteLineResponse[]>(`${this.apiUrl}/${id}/lines`);
  }

  addLine(quoteId: string, body: CreateQuoteLineRequest) {
    return this.http.post<QuoteLineResponse>(`${this.apiUrl}/${quoteId}/lines`, body);
  }

  removeLine(quoteId: string, lineId: string) {
    return this.http.delete<void>(`${this.apiUrl}/${quoteId}/lines/${lineId}`);
  }

  issue(id: string) {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/${id}/issue`, {});
  }

  accept(id: string) {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/${id}/accept`, {});
  }

  reject(id: string) {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/${id}/reject`, {});
  }

  cancel(id: string) {
    return this.http.post<QuoteResponse>(`${this.apiUrl}/${id}/cancel`, {});
  }
}

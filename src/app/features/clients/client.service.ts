import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ClientResponse, CreateClientRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/clients`;

  list(page = 0, size = 20, q?: string) {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (q) params.set('q', q);
    return this.http.get<Page<ClientResponse>>(`${this.apiUrl}?${params}`);
  }

  get(id: string) {
    return this.http.get<ClientResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateClientRequest) {
    return this.http.post<ClientResponse>(this.apiUrl, body);
  }

  update(id: string, body: CreateClientRequest) {
    return this.http.put<ClientResponse>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activate(id: string) {
    return this.http.post<ClientResponse>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: string) {
    return this.http.post<ClientResponse>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SupplierResponse, CreateSupplierRequest, Page } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class SupplierService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/suppliers`;

  list(page = 0, size = 20, q?: string, status?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (status) params = params.set('status', status);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<SupplierResponse>>(this.apiUrl, { params });
  }

  get(id: string) {
    return this.http.get<SupplierResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateSupplierRequest) {
    return this.http.post<SupplierResponse>(this.apiUrl, body);
  }

  update(id: string, body: CreateSupplierRequest) {
    return this.http.put<SupplierResponse>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activate(id: string) {
    return this.http.post<SupplierResponse>(`${this.apiUrl}/${id}/activate`, {});
  }

  deactivate(id: string) {
    return this.http.post<SupplierResponse>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}

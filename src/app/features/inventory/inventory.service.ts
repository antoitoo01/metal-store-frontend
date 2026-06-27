import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { InventoryItemResponse, CreateInventoryItemRequest, Page, InventoryMovementResponse, AddStockRequest, RemoveStockRequest } from '../../core/models/api.types';

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/inventory`;

  list(page = 0, size = 20, q?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (sort) params = params.set('sort', sort);
    return this.http.get<Page<InventoryItemResponse>>(this.apiUrl, { params });
  }

  get(id: string) {
    return this.http.get<InventoryItemResponse>(`${this.apiUrl}/${id}`);
  }

  create(body: CreateInventoryItemRequest) {
    return this.http.post<InventoryItemResponse>(this.apiUrl, body);
  }

  update(id: string, body: CreateInventoryItemRequest) {
    return this.http.put<InventoryItemResponse>(`${this.apiUrl}/${id}`, body);
  }

  remove(id: string) {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMovements(id: string, page = 0, size = 20) {
    let params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<InventoryMovementResponse>>(`${this.apiUrl}/${id}/movements`, { params });
  }

  addStock(id: string, body: AddStockRequest) {
    return this.http.post<InventoryMovementResponse>(`${this.apiUrl}/${id}/add-stock`, body);
  }

  removeStock(id: string, body: RemoveStockRequest) {
    return this.http.post<InventoryMovementResponse>(`${this.apiUrl}/${id}/remove-stock`, body);
  }
}

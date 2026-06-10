import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { CatalogProfile, CatalogFamily, CatalogItem, TypeResponse, CreateTypeRequest, Page } from '../../core/models/api.types';

export interface ImageUploadResponse {
  imageUrl: string;
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/catalog`;
  readonly apiUrl = `${environment.apiUrl}/api`;

  profiles(page = 0, size = 20, q?: string, standard?: string, shapeType?: string, familyCode?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (standard) params = params.set('standard', standard);
    if (shapeType) params = params.set('shapeType', shapeType);
    if (familyCode) params = params.set('familyCode', familyCode);
    return this.http.get<Page<CatalogProfile>>(`${this.api}/profiles`, { params });
  }

  getProfile(id: string) {
    return this.http.get<CatalogProfile>(`${this.api}/profiles/${id}`);
  }

  families(standard?: string) {
    let params = new HttpParams();
    if (standard) params = params.set('standard', standard);
    return this.http.get<CatalogFamily[]>(`${this.api}/families`, { params });
  }

  items(page = 0, size = 20, q?: string, itemType?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (itemType) params = params.set('itemType', itemType);
    return this.http.get<Page<CatalogItem>>(`${this.api}/items`, { params });
  }

  getItem(id: string) {
    return this.http.get<CatalogItem>(`${this.api}/items/${id}`);
  }

  itemTypes(page = 0, size = 50) {
    const params = new HttpParams().set('page', page).set('size', size);
    return this.http.get<Page<TypeResponse>>(`${this.api}/item-types`, { params });
  }

  getItemType(id: string) {
    return this.http.get<TypeResponse>(`${this.api}/item-types/${id}`);
  }

  createItemType(body: CreateTypeRequest) {
    return this.http.post<TypeResponse>(`${this.api}/item-types`, body);
  }

  updateItemType(id: string, body: CreateTypeRequest) {
    return this.http.put<TypeResponse>(`${this.api}/item-types/${id}`, body);
  }

  deleteItemType(id: string) {
    return this.http.delete<void>(`${this.api}/item-types/${id}`);
  }

  uploadProfileImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageUploadResponse>(`${this.api}/profiles/${id}/image`, formData);
  }

  deleteProfileImage(id: string) {
    return this.http.delete<void>(`${this.api}/profiles/${id}/image`);
  }

  uploadItemImage(id: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImageUploadResponse>(`${this.api}/items/${id}/image`, formData);
  }

  deleteItemImage(id: string) {
    return this.http.delete<void>(`${this.api}/items/${id}/image`);
  }
}

import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CatalogProfile, CatalogFamily, CatalogItem, TypeResponse, CreateTypeRequest, Page } from '../../core/models/api.types';

export interface ImageUploadResponse {
  imageUrl: string;
}

interface RawProfile {
  id: string;
  designation: string;
  weightKgM: number | null;
  areaCm2: number | null;
  imagePath: string | null;
  familyId: string;
  familyStandard: string;
  familyCode: string;
  familyShapeType: string;
  familyDescription: string;
  createdAt: string;
  updatedAt: string;
}

interface RawPage<T> {
  content: T[];
  page: { size: number; number: number; totalElements: number; totalPages: number };
}

function toProfile(raw: RawProfile): CatalogProfile {
  return {
    id: raw.id,
    family: {
      id: raw.familyId,
      code: raw.familyCode,
      name: raw.familyDescription,
      standard: raw.familyStandard,
      shapeType: raw.familyShapeType,
    },
    designation: raw.designation,
    weightKgM: raw.weightKgM,
    areaCm2: raw.areaCm2,
    imagePath: raw.imagePath,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}

function flattenPage<T>(raw: RawPage<T>): Page<T> {
  return {
    content: raw.content,
    totalElements: raw.page.totalElements,
    totalPages: raw.page.totalPages,
    size: raw.page.size,
    number: raw.page.number,
    first: raw.page.number === 0,
    last: raw.page.number >= raw.page.totalPages - 1,
    empty: raw.content.length === 0,
  };
}

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/catalog`;
  readonly apiUrl = `${environment.apiUrl}/api`;

  profiles(page = 0, size = 20, q?: string, standard?: string, shapeType?: string, familyCode?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (standard) params = params.set('standard', standard);
    if (shapeType) params = params.set('shapeType', shapeType);
    if (familyCode) params = params.set('familyCode', familyCode);
    if (sort) params = params.set('sort', sort);
    return this.http.get<RawPage<RawProfile>>(`${this.api}/profiles`, { params }).pipe(
      map(raw => ({ ...flattenPage(raw), content: raw.content.map(toProfile) })),
    );
  }

  getProfile(id: string) {
    return this.http.get<RawProfile>(`${this.api}/profiles/${id}`).pipe(
      map(raw => toProfile(raw)),
    );
  }

  families(standard?: string) {
    let params = new HttpParams();
    if (standard) params = params.set('standard', standard);
    return this.http.get<CatalogFamily[]>(`${this.api}/families`, { params });
  }

  items(page = 0, size = 20, q?: string, itemType?: string, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (q) params = params.set('q', q);
    if (itemType) params = params.set('itemType', itemType);
    if (sort) params = params.set('sort', sort);
    return this.http.get<RawPage<CatalogItem>>(`${this.api}/items`, { params }).pipe(
      map(raw => flattenPage(raw)),
    );
  }

  getItem(id: string) {
    return this.http.get<CatalogItem>(`${this.api}/items/${id}`);
  }

  itemTypes(page = 0, size = 50, sort?: string) {
    let params = new HttpParams().set('page', page).set('size', size);
    if (sort) params = params.set('sort', sort);
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

  searchProfiles(q: string, limit = 10) {
    return this.http.get<Page<CatalogProfile>>(`${this.api}/profiles`, {
      params: new HttpParams().set('q', q).set('page', 0).set('size', limit),
    });
  }

  searchItems(q: string, limit = 10) {
    return this.http.get<Page<CatalogItem>>(`${this.api}/items`, {
      params: new HttpParams().set('q', q).set('page', 0).set('size', limit),
    });
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

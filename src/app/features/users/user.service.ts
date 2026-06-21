import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { UserResponse, Page } from '../../core/models/api.types';
import type { Observable } from 'rxjs';

export interface UserListParams {
  q?: string;
  page?: number;
  size?: number;
  sort?: string;
}

@Injectable({ providedIn: 'root' })
export class UserService {
  private readonly http = inject(HttpClient);
  private readonly api = `${environment.apiUrl}/api/users`;

  checkAvailability(field: 'username' | 'email', value: string) {
    const params = new HttpParams().set('field', field).set('value', value);
    return this.http.get<{ available: boolean }>(`${this.api}/check`, { params });
  }

  list(params?: UserListParams) {
    let httpParams = new HttpParams();
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.page != null) httpParams = httpParams.set('page', params.page);
    if (params?.size != null) httpParams = httpParams.set('size', params.size);
    if (params?.sort) httpParams = httpParams.set('sort', params.sort);
    return this.http.get<Page<UserResponse>>(this.api, { params: httpParams });
  }

  get(id: string) {
    return this.http.get<UserResponse>(`${this.api}/${id}`);
  }

  update(body: { username?: string; email?: string }) {
    const filtered: Record<string, string> = {};
    if (body.username) filtered['username'] = body.username;
    if (body.email) filtered['email'] = body.email;
    return this.http.put<UserResponse>(this.api, filtered);
  }

  delete(id: string) {
    return this.http.delete<void>(`${this.api}/${id}`);
  }
}

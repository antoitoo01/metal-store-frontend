import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import type { LoginRequest, LoginResponse, RegisterRequest, UserResponse, UserRole } from '../models/api.types';
import { SKIP_TOAST, SKIP_AUTH_REDIRECT } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

interface StoredAuth {
  email: string;
  username: string;
  role: UserRole;
  tenantId: string;
  tenantName: string;
}

const STORAGE_KEY = 'metal_store_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  readonly user = signal<UserResponse | null>(null);
  readonly isAuthenticated = signal(false);

  #tenantId: string | null = null;

  get tenantId(): string | null {
    return this.#tenantId;
  }

  async initialize(): Promise<void> {
    if (this.#restoreFromStorage()) return;
    try {
      const user = await firstValueFrom(
        this.http.get<UserResponse>(`${this.apiUrl}/me`, {
          context: new HttpContext().set(SKIP_TOAST, true).set(SKIP_AUTH_REDIRECT, true),
        }),
      );
      this.#applyUser(user);
    } catch {
      // Sin sesión — el guard redirige a /login
    }
  }

  login(body: LoginRequest, rememberMe = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((res) => this.#handleAuthResponse(res, rememberMe)),
    );
  }

  register(body: RegisterRequest, rememberMe = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, body).pipe(
      tap((res) => this.#handleAuthResponse(res, rememberMe)),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => this.clearAuth()),
    );
  }

  clearAuth(): void {
    this.#tenantId = null;
    this.isAuthenticated.set(false);
    this.user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  #saveToStorage(data: StoredAuth, rememberMe: boolean): void {
    const raw = JSON.stringify(data);
    if (rememberMe) {
      localStorage.setItem(STORAGE_KEY, raw);
    } else {
      sessionStorage.setItem(STORAGE_KEY, raw);
    }
  }

  #restoreFromStorage(): boolean {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    try {
      const data: StoredAuth = JSON.parse(raw);
      this.#applyUser({
        id: data.tenantId,
        username: data.username,
        email: data.email,
        role: data.role,
        tenantId: data.tenantId,
        tenantName: data.tenantName,
      });
      return true;
    } catch {
      return false;
    }
  }

  #applyUser(u: UserResponse): void {
    this.user.set(u);
    this.isAuthenticated.set(true);
    this.#tenantId = u.tenantId;
  }

  #handleAuthResponse(res: LoginResponse, rememberMe: boolean): void {
    const user: UserResponse = {
      id: res.tenantId,
      username: res.username ?? res.email.split('@')[0],
      email: res.email,
      role: res.role,
      tenantId: res.tenantId,
      tenantName: res.tenantName,
    };
    this.#applyUser(user);
    this.#saveToStorage(user, rememberMe);
  }

  #clearAuth(): void {
    this.clearAuth();
  }
}

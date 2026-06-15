import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import type { LoginRequest, LoginResponse, RefreshRequest, RegisterRequest, UserResponse, UserOrganization, UserRole } from '../models/api.types';
import { SKIP_TOAST, SKIP_AUTH_REDIRECT } from '../interceptors/error.interceptor';
import { SKIP_AUTH } from '../interceptors/jwt.interceptor';
import { environment } from '../../../environments/environment';


interface StoredAuth {
  accessToken: string;
  refreshToken: string;
  email: string;
  username: string;
  role: UserRole;
  tenantId: string;
  organizationId: string;
  organizationName: string;
  organizations: UserOrganization[];
}

const STORAGE_KEY = 'metal_store_auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/api/auth`;

  readonly user = signal<UserResponse | null>(null);
  readonly isAuthenticated = signal(false);
  readonly organizations = signal<UserOrganization[]>([]);

  #tenantId: string | null = null;
  #organizationId: string | null = null;
  #accessToken: string | null = null;

  get tenantId(): string | null {
    return this.#tenantId;
  }

  get organizationId(): string | null {
    return this.#organizationId;
  }

  get accessToken(): string | null {
    return this.#accessToken;
  }

  async initialize(): Promise<void> {
    if (this.#restoreFromStorage()) return;

    const fallbackTenantId = crypto.randomUUID();
    this.#tenantId = fallbackTenantId;
    this.#organizationId = fallbackTenantId;

    try {
      const user = await firstValueFrom(
        this.http.get<UserResponse>(`${this.apiUrl}/me`, {
          context: new HttpContext().set(SKIP_TOAST, true).set(SKIP_AUTH_REDIRECT, true),
        }),
      );
      this.#applyUser(user);
    } catch {
      this.#tenantId = null;
      this.#organizationId = null;
    }
  }

  login(body: LoginRequest, rememberMe = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body, {
      context: new HttpContext().set(SKIP_AUTH, true),
    }).pipe(
      tap((res) => this.#handleAuthResponse(res, rememberMe)),
    );
  }

  register(body: RegisterRequest, rememberMe = false): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, body, {
      context: new HttpContext().set(SKIP_AUTH, true),
    }).pipe(
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
    this.#organizationId = null;
    this.#accessToken = null;
    this.isAuthenticated.set(false);
    this.user.set(null);
    this.organizations.set([]);
    localStorage.removeItem(STORAGE_KEY);
    sessionStorage.removeItem(STORAGE_KEY);
  }

  switchOrganization(orgId: string): void {
    const org = this.organizations().find(o => o.organizationId === orgId);
    if (!org) return;
    this.#organizationId = orgId;
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as StoredAuth;
        data.organizationId = orgId;
        const isRememberMe = localStorage.getItem(STORAGE_KEY) !== null;
        this.#saveToStorage(data, isRememberMe);
      } catch { /* ignore */ }
    }
    const u = this.user();
    if (u) this.user.set({ ...u, organizationId: orgId, organizationName: org.organizationName });
  }

  updateTokens(accessToken: string, refreshToken: string): void {
    this.#accessToken = accessToken;
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const data = JSON.parse(raw) as StoredAuth;
        data.accessToken = accessToken;
        data.refreshToken = refreshToken;
        const isRememberMe = localStorage.getItem(STORAGE_KEY) !== null;
        this.#saveToStorage(data, isRememberMe);
      } catch { /* ignore */ }
    }
  }

  refreshSession(): Observable<LoginResponse> {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    let refreshToken = '';
    let storedOrgs: UserOrganization[] = [];
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as StoredAuth;
        refreshToken = parsed.refreshToken;
        storedOrgs = parsed.organizations ?? [];
      } catch { /* ignore */ }
    }
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, { refreshToken } satisfies RefreshRequest, {
      context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_TOAST, true),
    }).pipe(
      tap((res) => {
        this.#accessToken = res.accessToken;
        const tenantId = res.tenantId;
        this.#saveToStorage({
          accessToken: res.accessToken,
          refreshToken: res.refreshToken ?? refreshToken,
          email: res.email,
          username: res.username ?? res.email.split('@')[0],
          role: res.role,
          tenantId,
          organizationId: res.organizationId,
          organizationName: res.organizationName,
          organizations: storedOrgs,
        }, raw ? localStorage.getItem(STORAGE_KEY) !== null : false);
      }),
    );
  }

  #saveToStorage(data: StoredAuth, rememberMe: boolean): void {
    this.#accessToken = data.accessToken;
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
        tenantId: data.tenantId,
        username: data.username,
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
        organizationName: data.organizationName,
        organizations: data.organizations ?? [],
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
    this.#organizationId = u.organizationId;
    const orgs = u.organizations ?? [];
    const hasCurrent = orgs.some(o => o.organizationId === u.organizationId);
    if (!hasCurrent) {
      orgs.unshift({ organizationId: u.organizationId, organizationName: u.organizationName, role: 'OWNER' as const });
    }
    this.organizations.set(orgs);
  }

  #handleAuthResponse(res: LoginResponse, rememberMe: boolean): void {
    const user: UserResponse = {
      id: res.tenantId,
      tenantId: res.tenantId,
      username: res.username ?? res.email.split('@')[0],
      email: res.email,
      role: res.role,
      organizationId: res.organizationId,
      organizationName: res.organizationName,
      organizations: [],
    };
    this.#applyUser(user);
    this.#saveToStorage({
      accessToken: res.accessToken,
      refreshToken: res.refreshToken ?? '',
      email: res.email,
      username: res.username ?? res.email.split('@')[0],
      role: res.role,
      tenantId: res.tenantId,
      organizationId: res.organizationId,
      organizationName: res.organizationName,
      organizations: this.organizations(),
    }, rememberMe);
  }
}

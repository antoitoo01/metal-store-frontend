import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { firstValueFrom, Observable, tap } from 'rxjs';
import { LoginRequest, LoginResponse, RegisterRequest, UserResponse } from '../models/api.types';
import { SKIP_TOAST } from '../interceptors/error.interceptor';
import { environment } from '../../../environments/environment';

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

  /** Llamar en APP_INITIALIZER: chequea si hay cookie de sesión vía /me */
  async initialize(): Promise<void> {
    try {
      const user = await firstValueFrom(
        this.http.get<UserResponse>(`${this.apiUrl}/me`, {
          context: new HttpContext().set(SKIP_TOAST, true),
        }),
      );
      this.user.set(user);
      this.isAuthenticated.set(true);
      this.#tenantId = user.tenantId;
    } catch {
      // Sin sesión — el guard redirige a /login
    }
  }

  login(body: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, body).pipe(
      tap((res) => this.#handleAuthResponse(res)),
    );
  }

  register(body: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/register`, body).pipe(
      tap((res) => this.#handleAuthResponse(res)),
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
  }

  #handleAuthResponse(res: LoginResponse): void {
    this.#tenantId = res.tenantId;
    this.isAuthenticated.set(true);
  }

  #clearAuth(): void {
    this.#tenantId = null;
    this.isAuthenticated.set(false);
    this.user.set(null);
  }
}

import { TestBed } from '@angular/core/testing';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { LoginResponse } from '../models/api.types';
import { environment } from '../../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AuthService, provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
    sessionStorage.clear();
  });

  describe('token storage', () => {
    it('almacena accessToken y refreshToken en localStorage con rememberMe', () => {
      const res: LoginResponse = {
        accessToken: 'jwt-abc',
        tokenType: 'Bearer',
        refreshToken: 'refresh-xyz',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      };

      service.login({ email: 'test@mail.com', password: 'pass1234' }, true).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(res);

      const stored = JSON.parse(localStorage.getItem('metal_store_auth')!);
      expect(stored.accessToken).toBe('jwt-abc');
      expect(stored.refreshToken).toBe('refresh-xyz');
    });

    it('almacena tokens en sessionStorage sin rememberMe', () => {
      const res: LoginResponse = {
        accessToken: 'jwt-def',
        tokenType: 'Bearer',
        refreshToken: 'refresh-uvw',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      };

      service.login({ email: 'test@mail.com', password: 'pass1234' }, false).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(res);

      expect(localStorage.getItem('metal_store_auth')).toBeNull();
      const stored = JSON.parse(sessionStorage.getItem('metal_store_auth')!);
      expect(stored.accessToken).toBe('jwt-def');
    });
  });

  describe('accessToken getter', () => {
    it('devuelve null sin token almacenado', () => {
      expect(service.accessToken).toBeNull();
    });

    it('devuelve el token después de login', () => {
      const res: LoginResponse = {
        accessToken: 'jwt-abc',
        tokenType: 'Bearer',
        refreshToken: 'refresh-xyz',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      };

      service.login({ email: 'test@mail.com', password: 'pass1234' }, true).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush(res);

      expect(service.accessToken).toBe('jwt-abc');
    });
  });

  describe('updateTokens', () => {
    it('actualiza tokens en storage', () => {
      service.login({
        email: 'test@mail.com', password: 'pass1234',
      }, true).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      req.flush({
        accessToken: 'old-token',
        tokenType: 'Bearer',
        refreshToken: 'old-refresh',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      } satisfies LoginResponse);

      service.updateTokens('new-token', 'new-refresh');

      const stored = JSON.parse(localStorage.getItem('metal_store_auth')!);
      expect(stored.accessToken).toBe('new-token');
      expect(stored.refreshToken).toBe('new-refresh');
    });
  });

  describe('refreshSession', () => {
    it('llama POST /api/auth/refresh con refreshToken', () => {
      service.login({
        email: 'test@mail.com', password: 'pass1234',
      }, true).subscribe();

      const loginReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/login`);
      loginReq.flush({
        accessToken: 'old-token',
        tokenType: 'Bearer',
        refreshToken: 'refresh-xyz',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      } satisfies LoginResponse);

      service.refreshSession().subscribe();

      const refreshReq = httpMock.expectOne(`${environment.apiUrl}/api/auth/refresh`);
      expect(refreshReq.request.method).toBe('POST');
      expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh-xyz' });
      refreshReq.flush({
        accessToken: 'new-token',
        tokenType: 'Bearer',
        refreshToken: 'new-refresh',
        expiresIn: 3600,
        email: 'test@mail.com',
        role: 'USER',
        tenantId: 't1',
        tenantName: 'Test',
      } satisfies LoginResponse);

      expect(service.accessToken).toBe('new-token');
    });
  });
});

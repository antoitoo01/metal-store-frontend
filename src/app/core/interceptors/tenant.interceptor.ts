import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

const STORAGE_KEY = 'metal_store_auth';

function readStoredTenantId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.tenantId ?? null;
  } catch {
    return null;
  }
}

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const tenantId = auth.tenantId ?? readStoredTenantId();
  if (tenantId) {
    req = req.clone({
      setHeaders: { 'X-Tenant-Id': tenantId },
    });
  }
  return next(req);
};
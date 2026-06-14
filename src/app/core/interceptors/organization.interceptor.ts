import { HttpInterceptorFn, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const SKIP_ORG = new HttpContextToken<boolean>(() => false);

const STORAGE_KEY = 'metal_store_auth';

function readStoredOrganizationId(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.organizationId ?? null;
  } catch {
    return null;
  }
}

export const organizationInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_ORG)) return next(req);

  const auth = inject(AuthService);
  const organizationId = auth.organizationId ?? readStoredOrganizationId();
  if (organizationId) {
    req = req.clone({
      setHeaders: { 'X-Organization-Id': organizationId },
    });
  }
  return next(req);
};

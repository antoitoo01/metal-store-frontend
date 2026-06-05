import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantInterceptor: HttpInterceptorFn = (req, next) => {
  const tenantId = inject(AuthService).tenantId;
  if (tenantId) {
    req = req.clone({
      setHeaders: { 'X-Tenant-Id': tenantId },
    });
  }
  return next(req);
};
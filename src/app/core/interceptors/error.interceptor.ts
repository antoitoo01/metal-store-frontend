import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { extractErrorMessage } from '../services/error-messages';
import { catchError, throwError } from 'rxjs';

export const SKIP_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401) {
        auth.clearAuth();
        if (!req.context.get(SKIP_AUTH_REDIRECT)) {
          router.navigate(['/login']);
        }
      }

      if (!req.context.get(SKIP_TOAST)) {
        notifications.error(extractErrorMessage(err));
      }

      return throwError(() => err);
    }),
  );
};
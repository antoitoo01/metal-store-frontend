import { HttpContextToken, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../services/notification.service';
import { extractErrorMessage } from '../services/error-messages';
import { catchError, throwError, take, switchMap, Subject } from 'rxjs';
import { SKIP_AUTH } from './jwt.interceptor';

export const SKIP_TOAST = new HttpContextToken<boolean>(() => false);
export const SKIP_AUTH_REDIRECT = new HttpContextToken<boolean>(() => false);

let isRefreshing = false;
let refreshComplete: Subject<void> | null = null;

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const auth = inject(AuthService);
  const notifications = inject(NotificationService);

  return next(req).pipe(
    catchError((err) => {
      if (err.status === 401 && !req.context.get(SKIP_AUTH) && auth.accessToken) {
        if (!isRefreshing) {
          isRefreshing = true;
          refreshComplete = new Subject<void>();

          return auth.refreshSession().pipe(
            switchMap(() => {
              isRefreshing = false;
              refreshComplete!.next();
              refreshComplete!.complete();
              return next(req);
            }),
            catchError(() => {
              isRefreshing = false;
              refreshComplete = null;
              auth.clearAuth();
              if (!req.context.get(SKIP_AUTH_REDIRECT)) {
                router.navigate(['/login']);
              }
              return throwError(() => err);
            }),
          );
        }

        return refreshComplete!.pipe(
          take(1),
          switchMap(() => next(req)),
        );
      }

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
import { HttpInterceptorFn, HttpResponse, HttpContextToken } from '@angular/common/http';
import { inject } from '@angular/core';
import { Logger } from '../services/logger.service';
import { tap, catchError, throwError } from 'rxjs';

export const SKIP_HTTP_LOG = new HttpContextToken<boolean>(() => false);

export const httpLoggingInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.context.get(SKIP_HTTP_LOG)) return next(req);

  const logger = inject(Logger);
  const start = performance.now();
  const method = req.method;
  const url = req.urlWithParams.replace(/Bearer\s+\S+/gi, 'Bearer [REDACTED]');

  logger.debug('HTTP', '>>', `${method} ${url}`);

  return next(req).pipe(
    tap({
      next: (event) => {
        if (event instanceof HttpResponse) {
          const ms = (performance.now() - start).toFixed(1);
          if (event.status >= 400) {
            logger.warn('HTTP', `<< ${method} ${url} → ${event.status} (${ms}ms)`);
          } else {
            logger.info('HTTP', `<< ${method} ${url} → ${event.status} (${ms}ms)`);
          }
        }
      },
      error: (err) => {
        const ms = (performance.now() - start).toFixed(1);
        logger.error('HTTP', `!! ${method} ${url} → ${err.status ?? 'NETWORK_ERROR'} (${ms}ms)`, {
          status: err.status,
          statusText: err.statusText,
          message: err.message,
          error: err.error,
        });
      },
    }),
    catchError((err) => throwError(() => err)),
  );
};

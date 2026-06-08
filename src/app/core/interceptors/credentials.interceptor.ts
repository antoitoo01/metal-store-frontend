import { HttpInterceptorFn } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export const credentialsInterceptor: HttpInterceptorFn = (req, next) => {
  if (!environment.production) {
    req = req.clone({ withCredentials: true });
  }
  return next(req);
};
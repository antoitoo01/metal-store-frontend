import { ApplicationConfig, provideAppInitializer, provideBrowserGlobalErrorListeners, inject } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideTanStackQuery, QueryClient } from '@tanstack/angular-query-experimental';

import { routes } from './app.routes';
import { AuthService } from './core/services/auth.service';
import { credentialsInterceptor } from './core/interceptors/credentials.interceptor';
import { tenantInterceptor } from './core/interceptors/tenant.interceptor';
import { errorInterceptor } from './core/interceptors/error.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([credentialsInterceptor, tenantInterceptor, errorInterceptor])),
    provideTanStackQuery(new QueryClient()),
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      return auth.initialize();
    }),
  ]
};

import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { authInterceptor } from './auth-fn.interceptor';

/**
 * @deprecated Use the functional authInterceptor with provideHttpClient(withInterceptors([authInterceptor]))
 * instead of withInterceptorsFromDi() and this provider array to avoid circular dependencies.
 */
export const httpInterceptorProviders = [
  { provide: HTTP_INTERCEPTORS, useClass: authInterceptor, multi: true }
];

// Export the functional interceptor
export { authInterceptor };
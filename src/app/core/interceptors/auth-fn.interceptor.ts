import {
  HttpErrorResponse,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

// Shared state outside the interceptor function
let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

/**
 * Check if URL is for an auth endpoint that doesn't need a token
 */
function isAuthEndpoint(url: string): boolean {
  // Endpoints that don't need token or handle auth themselves
  return url.includes('/auth/login') || url.includes('/auth/refresh');
}

/**
 * Add auth token to the request headers
 */
function addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

/**
 * Handle 401 Unauthorized errors by refreshing the token
 */
function handle401Error(
  request: HttpRequest<any>, 
  next: HttpHandlerFn,
  authService: AuthService,
  router: Router
): Observable<any> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);
    
    return authService.refreshToken().pipe(
      switchMap(response => {
        isRefreshing = false;
        refreshTokenSubject.next(response.access_token);
        
        // Retry the request with new token
        return next(addTokenToRequest(request, response.access_token));
      }),
      catchError(refreshError => {
        isRefreshing = false;
        
        // If refresh token also fails, log out the user
        authService.logout();
        router.navigate(['/login']);
        
        return throwError(() => refreshError);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  } else {
    // Wait for the token to be refreshed
    return refreshTokenSubject.pipe(
      filter(token => token !== null),
      take(1),
      switchMap(token => {
        return next(addTokenToRequest(request, token as string));
      })
    );
  }
}

/**
 * Functional HTTP interceptor for authentication
 * Handles adding auth tokens to requests and refreshing expired tokens
 */
export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>, 
  next: HttpHandlerFn
): Observable<any> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip adding auth token for login, refresh endpoints
  if (isAuthEndpoint(request.url)) {
    return next(request);
  }
  
  // Add auth token to request if available
  const token = authService.token;
  if (token) {
    request = addTokenToRequest(request, token);
  }
  
  return next(request).pipe(
    catchError(error => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // Handle 401 Unauthorized errors
        return handle401Error(request, next, authService, router);
      }
      return throwError(() => error);
    })
  );
};

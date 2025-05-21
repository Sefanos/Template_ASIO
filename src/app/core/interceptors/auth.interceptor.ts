import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, filter, finalize, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Skip adding auth token for login, refresh endpoints
    if (this.isAuthEndpoint(request.url)) {
      return next.handle(request);
    }
    
    // Add auth token to request if available
    const token = this.authService.token;
    if (token) {
      request = this.addTokenToRequest(request, token);
    }
    
    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          // Handle 401 Unauthorized errors
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }
  
  private isAuthEndpoint(url: string): boolean {
    // Endpoints that don't need token or handle auth themselves
    return url.includes('/auth/login') || url.includes('/auth/refresh');
  }
  
  private addTokenToRequest(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
  
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);
      
      return this.authService.refreshToken().pipe(
        switchMap(response => {
          this.isRefreshing = false;
          this.refreshTokenSubject.next(response.access_token);
          
          // Retry the request with new token
          return next.handle(this.addTokenToRequest(request, response.access_token));
        }),
        catchError(refreshError => {
          this.isRefreshing = false;
          
          // If refresh token also fails, log out the user
          this.authService.logout();
          this.router.navigate(['/login']);
          
          return throwError(() => refreshError);
        }),
        finalize(() => {
          this.isRefreshing = false;
        })
      );
    } else {
      // Wait for the token to be refreshed
      return this.refreshTokenSubject.pipe(
        filter(token => token !== null),
        take(1),
        switchMap(token => {
          return next.handle(this.addTokenToRequest(request, token));
        })
      );
    }
  }
}
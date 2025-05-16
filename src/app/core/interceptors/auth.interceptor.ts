import { Injectable } from '@angular/core';
import { 
  HttpRequest, 
  HttpHandler, 
  HttpEvent, 
  HttpInterceptor 
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Check if we have a logged in user with authentication info
    const user = this.authService.currentUserValue;
    
    if (user) {
      // This is where you would typically add JWT token or other auth headers
      // For now we'll just add a mock Authorization header
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer mock-token-${user.username}`
        }
      });
    }
    
    return next.handle(request);
  }
}
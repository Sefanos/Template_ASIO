import { ApplicationConfig, ErrorHandler } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { httpInterceptorProviders } from './core/interceptors';
import { provideAnimations } from '@angular/platform-browser/animations';

// Custom error handler to log detailed errors
class CustomErrorHandler implements ErrorHandler {
  handleError(error: any): void {
    console.error('Angular Error Details:', error);
    // Log the stack trace
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptorsFromDi()),
    httpInterceptorProviders,
    provideAnimations(),
    { provide: ErrorHandler, useClass: CustomErrorHandler }
  ]
};
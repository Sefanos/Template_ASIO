import { ApplicationConfig, ErrorHandler, inject } from '@angular/core';
import { provideRouter, withComponentInputBinding, withViewTransitions } from '@angular/router';
import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './core/interceptors';
import { provideAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DEFAULT_OPTIONS } from '@angular/material/dialog';
import { LoggingService } from './shared/services/loggin.service'; // FIXED: Updated import path

// Custom error handler to log detailed errors
export class GlobalErrorHandler implements ErrorHandler {
  private loggingService = inject(LoggingService);

  handleError(error: any): void {
    try {
      // Log the error using the logging service
      this.loggingService.error('Global error occurred:', error);
    } catch (loggingError) {
      // Fallback if logging service fails
      console.error('Logging service failed:', loggingError);
    }
    
    // Log to console as fallback
    console.error('Global error occurred:', error);
    
    // You can also send errors to a remote logging service here
    // this.sendErrorToRemoteService(error);
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withComponentInputBinding(), withViewTransitions()),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    LoggingService,
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: MAT_DIALOG_DEFAULT_OPTIONS, useValue: { hasBackdrop: true } }
  ]
};
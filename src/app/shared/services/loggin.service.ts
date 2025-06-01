import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  debug(message: string, data?: any): void {
    console.debug(`[DEBUG] ${message}`, data || '');
  }
  
  info(message: string, data?: any): void {
    console.info(`[INFO] ${message}`, data || '');
  }
  
  warn(message: string, data?: any): void {
    console.warn(`[WARN] ${message}`, data || '');
  }
  
  error(message: string, data?: any): void {
    console.error(`[ERROR] ${message}`, data || '');
  }
  
  // Additional method for structured error logging
  logError(error: Error, context?: string): void {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      context: context || 'Unknown',
      timestamp: new Date().toISOString()
    };
    
    console.error(`[ERROR] ${context || 'Application Error'}:`, errorInfo);
  }
}
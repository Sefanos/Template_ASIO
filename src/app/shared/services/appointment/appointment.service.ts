import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Appointment, AppointmentStatus, AppointmentFilter } from '../../../models/appointment.model';
import { LoggingService } from '../loggin.service'; 
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  // Use environment variable or hardcoded URL for the API endpoint
  private apiUrl = `${environment.apiUrl}/appointments`;

  constructor(
    private http: HttpClient,
    private loggingService: LoggingService
  ) {}

  // Core CRUD operations
  getAppointments(filters?: AppointmentFilter): Observable<Appointment[]> {
    this.loggingService.debug('Fetching appointments', filters);
    
    // Convert filters to HttpParams
    let params = new HttpParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params = params.append(`${key}[]`, v.toString()));
          } else {
            params = params.set(key, value.toString());
          }
        }
      });
    }

    return this.http.get<Appointment[]>(this.apiUrl, { params })
      .pipe(
        tap(data => this.loggingService.debug('Appointments fetched', data)),
        catchError((error) => this.handleError(error)) // FIXED: Use arrow function to preserve 'this'
      );
  }
  
  getAppointment(id: number): Observable<Appointment> {
    this.loggingService.debug('Fetching appointment', id);
    
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`)
      .pipe(
        tap(data => this.loggingService.debug('Appointment fetched', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  createAppointment(appointment: Partial<Appointment>): Observable<Appointment> {
    this.loggingService.debug('Creating appointment', appointment);
    
    return this.http.post<Appointment>(this.apiUrl, appointment)
      .pipe(
        tap(data => this.loggingService.debug('Appointment created', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  updateAppointment(id: number, appointment: Partial<Appointment>): Observable<Appointment> {
    this.loggingService.debug('Updating appointment', { id, data: appointment });
    
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment)
      .pipe(
        tap(data => this.loggingService.debug('Appointment updated', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  deleteAppointment(id: number): Observable<any> {
    this.loggingService.debug('Deleting appointment', id);
    
    return this.http.delete(`${this.apiUrl}/${id}`)
      .pipe(
        tap(data => this.loggingService.debug('Appointment deleted', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }

  // Business logic operations
  cancelAppointment(id: number, reason: string, cancelledBy?: string): Observable<Appointment> {
    this.loggingService.debug('Cancelling appointment', { id, reason, cancelledBy });
    
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/cancel`, { reason, cancelledBy })
      .pipe(
        tap(data => this.loggingService.debug('Appointment cancelled', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  rescheduleAppointment(id: number, date: string, time: string): Observable<Appointment> {
    this.loggingService.debug('Rescheduling appointment', { id, date, time });
    
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/reschedule`, { date, time })
      .pipe(
        tap(data => this.loggingService.debug('Appointment rescheduled', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  confirmAppointment(id: number): Observable<Appointment> {
    this.loggingService.debug('Confirming appointment', id);
    
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/confirm`, {})
      .pipe(
        tap(data => this.loggingService.debug('Appointment confirmed', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  completeAppointment(id: number, notes?: string[]): Observable<Appointment> {
    this.loggingService.debug('Completing appointment', { id, notes });
    
    return this.http.post<Appointment>(`${this.apiUrl}/${id}/complete`, { notes })
      .pipe(
        tap(data => this.loggingService.debug('Appointment completed', data)),
        catchError((error) => this.handleError(error)) // FIXED
      );
  }
  
  // Error handling - FIXED: Made it an arrow function to preserve 'this' context
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An error occurred with the appointment service';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Client error: ${error.error.message}`;
    } else {
      // Server-side error
      errorMessage = `Server error: ${error.status} - ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    // Now 'this' is properly bound
    this.loggingService.error(errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
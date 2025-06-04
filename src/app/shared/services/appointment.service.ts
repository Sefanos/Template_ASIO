import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';
import { AppointmentMapperService } from './appointment-mapper.service';
import { environment } from '../../../environments/environment'; // ✅ Import environment

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private baseUrl = environment.apiUrl ; // ✅ Add full URL

  constructor(
    private http: HttpClient,
    private mapper: AppointmentMapperService
  ) {}

  // ✅ Fixed getAllAppointments with proper error handling
  getAllAppointments(filters?: any): Observable<Appointment[]> {
    console.log('🔄 SERVICE: Loading appointments with filters:', filters);
    
    return this.http.get<any>(`${this.baseUrl}/appointments`, { params: filters })
      .pipe(
        map(response => {
          console.log('📥 SERVICE: Raw API response:', response);
          
          // ✅ Handle different response structures
          let appointmentsData: ApiAppointmentResponse[];
          
          if (Array.isArray(response)) {
            // Direct array response
            appointmentsData = response;
          } else if (response.data && Array.isArray(response.data)) {
            // Paginated response with data property
            appointmentsData = response.data;
          } else if (response.appointments && Array.isArray(response.appointments)) {
            // Response with appointments property
            appointmentsData = response.appointments;
          } else {
            console.error('❌ SERVICE: Unexpected response structure:', response);
            throw new Error('Invalid API response structure');
          }
          
          console.log('📊 SERVICE: Appointments data to transform:', appointmentsData);
          const transformedAppointments = this.mapper.mapApiResponseArrayToAppointments(appointmentsData);
          console.log('✅ SERVICE: Transformed appointments:', transformedAppointments);
          
          return transformedAppointments;
        }),
        catchError(error => {
          console.error('❌ SERVICE: Error in getAllAppointments:', error);
          return throwError(() => error);
        })
      );
  }

  getAppointmentById(id: number): Observable<Appointment> {
    return this.http.get<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}`)
      .pipe(
        map(response => {
          console.log('📥 SERVICE: Single appointment response:', response);
          return this.mapper.mapApiResponseToAppointment(response);
        }),
        catchError(error => {
          console.error('❌ SERVICE: Error getting appointment by ID:', error);
          return throwError(() => error);
        })
      );
  }

  createAppointment(appointment: Appointment, patientId: number, doctorId: number): Observable<Appointment> {
    const apiRequest = this.mapper.mapAppointmentToApiRequest(appointment, patientId, doctorId);
    console.log('📤 SERVICE: Creating appointment with data:', apiRequest);
    
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments`, apiRequest)
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response)),
        catchError(error => {
          console.error('❌ SERVICE: Error creating appointment:', error);
          return throwError(() => error);
        })
      );
  }

  updateAppointment(id: number, appointment: Appointment): Observable<Appointment> {
    const apiRequest = this.mapper.mapAppointmentToApiRequest(appointment);
    console.log('📤 SERVICE: Updating appointment with data:', apiRequest);
    
    return this.http.put<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}`, apiRequest)
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response)),
        catchError(error => {
          console.error('❌ SERVICE: Error updating appointment:', error);
          return throwError(() => error);
        })
      );
  }

  deleteAppointment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/appointments/${id}`)
      .pipe(
        catchError(error => {
          console.error('❌ SERVICE: Error deleting appointment:', error);
          return throwError(() => error);
        })
      );
  }

  // ✅ Fixed appointment actions
  confirmAppointment(id: number): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/confirm`, {})
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response)),
        catchError(error => {
          console.error('❌ SERVICE: Error confirming appointment:', error);
          return throwError(() => error);
        })
      );
  }

  cancelAppointment(id: number, reason: string): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/cancel`, { reason })
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response)),
        catchError(error => {
          console.error('❌ SERVICE: Error canceling appointment:', error);
          return throwError(() => error);
        })
      );
  }

  completeAppointment(id: number, notes?: string): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/complete`, { notes })
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response)),
        catchError(error => {
          console.error('❌ SERVICE: Error completing appointment:', error);
          return throwError(() => error);
        })
      );
  }

  rescheduleAppointment(id: number, newDateTime: string): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/reschedule`, { 
      new_datetime: newDateTime 
    }).pipe(
      map(response => this.mapper.mapApiResponseToAppointment(response)),
      catchError(error => {
        console.error('❌ SERVICE: Error rescheduling appointment:', error);
        return throwError(() => error);
      })
    );
  }

  // Utility methods
  getAvailableSlots(doctorId: number, date: string): Observable<string[]> {
    return this.http.get<{ slots: string[] }>(`${this.baseUrl}/appointments/slots/available`, {
      params: { doctor_id: doctorId.toString(), date }
    }).pipe(
      map(response => response.slots),
      catchError(error => {
        console.error('❌ SERVICE: Error getting available slots:', error);
        return throwError(() => error);
      })
    );
  }

  checkConflicts(doctorId: number, startTime: string, endTime: string, excludeId?: number): Observable<boolean> {
    const params: any = { doctor_id: doctorId.toString(), start_time: startTime, end_time: endTime };
    if (excludeId) params.exclude_id = excludeId.toString();
    
    return this.http.get<{ has_conflict: boolean }>(`${this.baseUrl}/appointments/check-conflicts`, { params })
      .pipe(
        map(response => response.has_conflict),
        catchError(error => {
          console.error('❌ SERVICE: Error checking conflicts:', error);
          return throwError(() => error);
        })
      );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';
import { AppointmentMapperService } from './appointment-mapper.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PatientAppointmentService {
  private baseUrl = environment.apiUrl + '/patient/appointments';

  constructor(
    private http: HttpClient,
    private mapper: AppointmentMapperService
  ) {}

  // Patient-specific methods
  getMyAppointments(filters?: any): Observable<Appointment[]> {
    let params = new HttpParams();
    if (filters) {
      Object.keys(filters).forEach(key => {
        if (filters[key] !== null && filters[key] !== undefined) {
          params = params.set(key, filters[key]);
        }
      });
    }

    return this.http.get<{success: boolean, data: ApiAppointmentResponse[]}>(`${this.baseUrl}`, { params })
      .pipe(
        map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)),
        catchError(error => {
          console.error('Error fetching appointments:', error);
          return throwError(() => error);
        })
      );
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
    return this.http.get<{success: boolean, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/upcoming`)
      .pipe(
        map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)),
        catchError(error => throwError(() => error))
      );
  }

  getTodaysAppointments(): Observable<Appointment[]> {
    return this.http.get<{success: boolean, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/today`)
      .pipe(
        map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)),
        catchError(error => throwError(() => error))
      );
  }

  getNextAppointment(): Observable<Appointment | null> {
    return this.http.get<{success: boolean, data: ApiAppointmentResponse | null}>(`${this.baseUrl}/next`)
      .pipe(
        map(response => response.data ? this.mapper.mapApiResponseToAppointment(response.data) : null),
        catchError(error => throwError(() => error))
      );
  }

  getAppointmentHistory(perPage: number = 15): Observable<{data: Appointment[], pagination: any}> {
    let params = new HttpParams().set('per_page', perPage.toString());
    
    return this.http.get<{success: boolean, data: ApiAppointmentResponse[], pagination: any}>(`${this.baseUrl}/history`, { params })
      .pipe(
        map(response => ({
          data: this.mapper.mapApiResponseArrayToAppointments(response.data),
          pagination: response.pagination
        })),
        catchError(error => throwError(() => error))
      );
  }

  getAppointmentDetails(id: number): Observable<Appointment> {
    return this.http.get<{success: boolean, data: ApiAppointmentResponse}>(`${this.baseUrl}/${id}`)
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response.data)),
        catchError(error => throwError(() => error))
      );
  }

  bookAppointment(appointmentData: any): Observable<Appointment> {
    return this.http.post<{success: boolean, data: ApiAppointmentResponse}>(`${this.baseUrl}`, appointmentData)
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response.data)),
        catchError(error => throwError(() => error))
      );
  }

  cancelMyAppointment(id: number, reason: string): Observable<boolean> {
    return this.http.post<{success: boolean}>(`${this.baseUrl}/${id}/cancel`, { reason })
      .pipe(
        map(response => response.success),
        catchError(error => throwError(() => error))
      );
  }

  rescheduleMyAppointment(id: number, newDateTime: any): Observable<Appointment> {
    return this.http.post<{success: boolean, data: ApiAppointmentResponse}>(`${this.baseUrl}/${id}/reschedule`, newDateTime)
      .pipe(
        map(response => this.mapper.mapApiResponseToAppointment(response.data)),
        catchError(error => throwError(() => error))
      );
  }

  getAvailableDoctors(): Observable<any[]> {
    return this.http.get<{success: boolean, data: any[]}>(`${this.baseUrl}/doctors/available`)
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => error))
      );
  }

  getAvailableSlots(doctorId: number, date: string): Observable<any> {
    let params = new HttpParams()
      .set('doctor_id', doctorId.toString())
      .set('date', date);

    return this.http.get<{success: boolean, data: any}>(`${this.baseUrl}/slots/available`, { params })
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => error))
      );
  }

  getPatientStats(): Observable<any> {
    return this.http.get<{success: boolean, data: any}>(`${this.baseUrl}/stats`)
      .pipe(
        map(response => response.data),
        catchError(error => throwError(() => error))
      );
  }
}
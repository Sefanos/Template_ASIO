import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';
import { AppointmentMapperService } from './appointment-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class PatientAppointmentService {
  private baseUrl = '/api/patient';

  constructor(
    private http: HttpClient,
    private mapper: AppointmentMapperService
  ) {}

  // Patient-specific methods
  getMyAppointments(): Observable<Appointment[]> {
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments`)
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  bookAppointment(appointment: Appointment, doctorId: number): Observable<Appointment> {
    const apiRequest = this.mapper.mapAppointmentToApiRequest(appointment, undefined, doctorId);
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments`, apiRequest)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  cancelMyAppointment(id: number, reason: string): Observable<Appointment> {
    return this.http.patch<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/cancel`, { reason })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  rescheduleMyAppointment(id: number, newDateTime: string): Observable<Appointment> {
    return this.http.patch<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/reschedule`, { 
      new_datetime: newDateTime 
    }).pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  getAvailableDoctors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/appointments/doctors`);
  }
}
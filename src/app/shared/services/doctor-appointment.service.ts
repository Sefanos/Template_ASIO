import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';
import { AppointmentMapperService } from './appointment-mapper.service';

@Injectable({
  providedIn: 'root'
})
export class DoctorAppointmentService {
  private baseUrl = '/api/doctor';

  constructor(
    private http: HttpClient,
    private mapper: AppointmentMapperService
  ) {}

  // Doctor-specific methods
  getMyAppointments(date?: string): Observable<Appointment[]> {
    const params = date ? { date } : {};
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments`, { params })
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  getAppointmentsByDateRange(startDate: string, endDate: string): Observable<Appointment[]> {
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/range`, {
      params: { start_date: startDate, end_date: endDate }
    }).pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  updateAppointmentNotes(id: number, notes: string): Observable<Appointment> {
    return this.http.patch<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/notes`, { notes })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  blockTimeSlot(startTime: string, endTime: string, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/block-time`, {
      start_time: startTime,
      end_time: endTime,
      reason
    });
  }

  createRecurringAppointments(appointmentData: any): Observable<Appointment[]> {
    return this.http.post<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/recurring`, appointmentData)
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }
}
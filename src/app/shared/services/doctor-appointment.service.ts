import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError } from 'rxjs/operators';
import { Appointment, ApiAppointmentResponse } from '../../models/appointment.model';
import { AppointmentMapperService } from './appointment-mapper.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorAppointmentService {
  private baseUrl = environment.apiUrl + '/doctor';
  constructor(
    private http: HttpClient,
    private mapper: AppointmentMapperService
  ) {}

  // Doctor-specific methods
  getMyAppointments(date?: string): Observable<Appointment[]> {
    const options = date ? { params: { date } } : {};
    return this.http.get<any>(`${this.baseUrl}/appointments`, options)
      .pipe(
        map(response => {
          // Extract the data array from the API response
          const appointmentData = response.success && response.data ? response.data : [];
          return this.mapper.mapApiResponseArrayToAppointments(appointmentData);
        })
      );
  }

  getAppointmentsByDateRange(startDate: string, endDate: string): Observable<Appointment[]> {
    console.log('DoctorAppointmentService: Making API call for date range:', { startDate, endDate });
    console.log('API URL:', `${this.baseUrl}/appointments`);
    
    // Check if user is authenticated before making the call
    console.log('Auth token exists:', !!localStorage.getItem('auth_token'));
    console.log('Current user exists:', !!localStorage.getItem('currentUser'));
    
    // Using the main appointments endpoint with date range parameters
    return this.http.get<any>(`${this.baseUrl}/appointments`, {
      params: { start_date: startDate, end_date: endDate }
    }).pipe(
      tap(response => console.log('API Response:', response)),
      map(response => {
        // Extract the data array from the API response
        const appointmentData = response.success && response.data ? response.data : [];
        console.log('Extracted appointment data:', appointmentData);
        return this.mapper.mapApiResponseArrayToAppointments(appointmentData);
      }),
      catchError(error => {
        console.error('HTTP Error in getAppointmentsByDateRange:', error);
        throw error;
      })
    );  }

  updateAppointmentNotes(id: number, notes: string): Observable<Appointment> {
    // Using the general update endpoint to update notes
    return this.http.put<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}`, { notes })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));  }

  blockTimeSlot(startTime: string, endTime: string, reason: string): Observable<any> {
    // Using the correct backend endpoint for blocking time slots
    return this.http.post(`${this.baseUrl}/appointments/time-slots/block`, {
      start_time: startTime,
      end_time: endTime,
      reason
    });
  }

  // Create new appointment
  createAppointment(appointmentData: any): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments`, appointmentData)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  // Update existing appointment
  updateAppointment(id: number, appointmentData: any): Observable<Appointment> {
    return this.http.put<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}`, appointmentData)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));  }

  createRecurringAppointments(appointmentData: any): Observable<Appointment[]> {
    return this.http.post<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/recurring`, appointmentData)
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));  }

  // Additional methods to match backend routes
  getTodaysSchedule(): Observable<Appointment[]> {
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/schedule/today`)
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/upcoming`)
      .pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  getScheduleForDate(date: string): Observable<Appointment[]> {
    return this.http.get<ApiAppointmentResponse[]>(`${this.baseUrl}/appointments/schedule/date`, {
      params: { date }
    }).pipe(map(responses => this.mapper.mapApiResponseArrayToAppointments(responses)));
  }

  // Appointment actions
  confirmAppointment(id: number): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/confirm`, {})
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  completeAppointment(id: number): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/complete`, {})
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  cancelAppointment(id: number, reason?: string): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/cancel`, { reason })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  markNoShow(id: number): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/no-show`, {})
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));
  }

  rescheduleAppointment(id: number, newDateTime: string): Observable<Appointment> {
    return this.http.post<ApiAppointmentResponse>(`${this.baseUrl}/appointments/${id}/reschedule`, {
      new_datetime: newDateTime
    }).pipe(map(response => this.mapper.mapApiResponseToAppointment(response)));  }

  // Time slot management
  getBlockedSlots(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/appointments/time-slots/blocked`);
  }

  unblockTimeSlot(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/appointments/time-slots/blocked/${id}`);
  }  // Patient search for appointments
  getAvailablePatients(search?: string): Observable<any[]> {
    const params: any = {};
    if (search) {
      params.search = search;
    }
    console.log('Making API call to search patients with params:', params);
    return this.http.get<any>(`${this.baseUrl}/appointments/patients/search`, { params })
      .pipe(
        tap(response => console.log('Raw API response:', response)),
        map(response => {
          // Extract the data array from the API response
          const patients = response.success && response.data ? response.data : [];
          console.log('Extracted patients:', patients);
          return patients;
        }),
        catchError(error => {
          console.error('Error in getAvailablePatients:', error);
          throw error;
        })
      );
  }

  // Check for scheduling conflicts
  checkConflicts(appointmentData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/appointments/check-conflicts`, appointmentData);
  }

  // Get appointment statistics
  getStats(): Observable<any> {
    return this.http.get(`${this.baseUrl}/appointments/stats`);
  }

  // Doctor settings
  getSettings(): Observable<any> {
    return this.http.get(`${this.baseUrl}/appointments/settings`);
  }

  updateSettings(settings: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/appointments/settings`, settings);
  }
}
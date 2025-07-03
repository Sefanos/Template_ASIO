import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map, tap, catchError, switchMap } from 'rxjs/operators';
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
    );  }  updateAppointmentNotes(id: number, notes: string): Observable<Appointment> {
    // Using the general update endpoint to update notes
    return this.http.put<{success: boolean, message: string, data: ApiAppointmentResponse}>(`${this.baseUrl}/appointments/${id}`, { notes_by_staff: notes })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data)));
  }
  blockTimeSlot(startTime: string, endTime: string, reason: string): Observable<any> {
    // Using the correct backend endpoint for blocking time slots with correct field names
    return this.http.post(`${this.baseUrl}/appointments/time-slots/block`, {
      start_datetime: startTime,
      end_datetime: endTime,
      reason
    });
  }
  // Create new appointment
  createAppointment(appointmentData: any): Observable<Appointment> {
    console.log('=== CREATE APPOINTMENT DEBUG START ===');
    console.log('API URL:', `${this.baseUrl}/appointments`);
    console.log('Base URL parts:', {
      environment_apiUrl: environment.apiUrl,
      baseUrl: this.baseUrl,
      fullUrl: `${this.baseUrl}/appointments`
    });
    console.log('Request payload:', JSON.stringify(appointmentData, null, 2));
    
    // Check authentication
    const token = localStorage.getItem('auth_token');
    const currentUser = localStorage.getItem('currentUser');
    console.log('Auth details:', {
      hasToken: !!token,
      tokenLength: token ? token.length : 0,
      tokenPreview: token ? token.substring(0, 20) + '...' : 'None',
      hasCurrentUser: !!currentUser,
      currentUserPreview: currentUser ? JSON.parse(currentUser).email : 'None'
    });
    
    // Make a test request to check if the endpoint is reachable
    console.log('=== Making HTTP POST request ===');
    
    return this.http.post<any>(`${this.baseUrl}/appointments`, appointmentData, {
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    }).pipe(
        tap(response => {
          console.log('✅ Create appointment SUCCESS:', response);
          console.log('=== CREATE APPOINTMENT DEBUG END ===');
        }),
        map(response => {
          // Handle the backend response wrapper format for create operations
          if (response.success && response.data) {
            console.log('Extracting appointment data from response wrapper:', response.data);
            return this.mapper.mapApiResponseToAppointment(response.data);
          } else {
            // Direct appointment data (for compatibility)
            return this.mapper.mapApiResponseToAppointment(response);
          }
        }),
        catchError(error => {
          console.log('❌ Create appointment ERROR:', error);
          console.log('Error details:', {
            status: error.status,
            statusText: error.statusText,
            message: error.message,
            url: error.url,
            error: error.error
          });
          
          // Try to extract more details from the error
          if (error.error) {
            console.log('Backend error response:', error.error);
            if (typeof error.error === 'string') {
              try {
                const parsedError = JSON.parse(error.error);
                console.log('Parsed backend error:', parsedError);
              } catch (e) {
                console.log('Could not parse error as JSON:', error.error);
              }
            }
          }
          
          console.log('=== CREATE APPOINTMENT DEBUG END ===');
          throw error;
        })
      );
  }
  // Update existing appointment
  updateAppointment(id: number, appointmentData: any): Observable<Appointment> {
    return this.http.put<{success: boolean, message: string, data: ApiAppointmentResponse}>(`${this.baseUrl}/appointments/${id}`, appointmentData)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data)));  }
  createRecurringAppointments(appointmentData: any): Observable<Appointment[]> {
    return this.http.post<{success: boolean, message: string, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/appointments/recurring`, appointmentData)
      .pipe(map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)));
  }
  // Additional methods to match backend routes
  getTodaysSchedule(): Observable<Appointment[]> {
    return this.http.get<{success: boolean, message: string, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/appointments/schedule/today`)
      .pipe(map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)));
  }

  getUpcomingAppointments(): Observable<Appointment[]> {
    return this.http.get<{success: boolean, message: string, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/appointments/upcoming`)
      .pipe(map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)));
  }

  getScheduleForDate(date: string): Observable<Appointment[]> {
    return this.http.get<{success: boolean, message: string, data: ApiAppointmentResponse[]}>(`${this.baseUrl}/appointments/schedule/date`, {
      params: { date }
    }).pipe(map(response => this.mapper.mapApiResponseArrayToAppointments(response.data)));
  }  // Appointment actions
  confirmAppointment(id: number): Observable<Appointment> {
    return this.http.post<{success: boolean, message: string, data: {appointment: ApiAppointmentResponse}}>(`${this.baseUrl}/appointments/${id}/confirm`, {})
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data.appointment)));
  }

  completeAppointment(id: number, notes?: string): Observable<Appointment> {
    const payload = notes ? { notes_by_staff: notes } : {};
    return this.http.post<{success: boolean, message: string, data: {appointment: ApiAppointmentResponse}}>(`${this.baseUrl}/appointments/${id}/complete`, payload)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data.appointment)));
  }

  cancelAppointment(id: number, reason?: string): Observable<Appointment> {
    // Backend requires 'reason' field for cancellation
    const payload = { reason: reason || 'Cancelled by doctor' };
    return this.http.post<{success: boolean, message: string, data: {appointment: ApiAppointmentResponse}}>(`${this.baseUrl}/appointments/${id}/cancel`, payload)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data.appointment)));
  }

  markNoShow(id: number, notes?: string): Observable<Appointment> {
    const payload = notes ? { notes: notes } : {};
    return this.http.post<{success: boolean, message: string, data: {appointment: ApiAppointmentResponse}}>(`${this.baseUrl}/appointments/${id}/no-show`, payload)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data.appointment)));
  }
  rescheduleAppointment(id: number, newDatetimeStart: string, newDatetimeEnd?: string, reason?: string): Observable<Appointment> {
    const payload: any = { 
      new_datetime_start: newDatetimeStart 
    };
    
    if (newDatetimeEnd) payload.new_datetime_end = newDatetimeEnd;
    if (reason) payload.reason = reason;
    
    return this.http.post<{success: boolean, message: string, data: ApiAppointmentResponse}>(`${this.baseUrl}/appointments/${id}/reschedule`, payload)
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data)));
  }
  // Time slot management
  getBlockedSlots(startDate?: string, endDate?: string): Observable<any[]> {
    let params: any = {};
    
    if (startDate && endDate) {
      // Date range query
      params.start_date = startDate;
      params.end_date = endDate;
    } else if (startDate) {
      // Single date query
      params.date = startDate;
    }
    
    return this.http.get<any>(`${this.baseUrl}/appointments/time-slots/blocked`, { params }).pipe(
      map(response => {
        // Extract the data array from the API response
        return response.data || [];
      })
    );
  }unblockTimeSlot(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/appointments/time-slots/blocked/${id}`);
  }
  // Delete blocked time slot (alias for unblockTimeSlot for consistency)
  deleteBlockedTimeSlot(id: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/appointments/time-slots/blocked/${id}`);
  }// Update blocked time slot (delete old and create new)
  updateBlockedTimeSlot(id: number, startTime: string, endTime: string, reason: string): Observable<any> {
    // Since there's no PUT endpoint, we'll delete the old one and create a new one
    return this.unblockTimeSlot(id).pipe(
      tap(() => console.log('Deleted old blocked time slot:', id)),
      switchMap(() => this.blockTimeSlot(startTime, endTime, reason)),
      tap((result) => console.log('Created new blocked time slot:', result))
    );
  }
  deleteAppointment(id: number | string): Observable<any> {
  return this.http.delete(`${this.baseUrl}/appointments/${id}`);
}
  // Patient search for appointments
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
    console.log('Checking conflicts with payload:', appointmentData);
    return this.http.post(`${this.baseUrl}/appointments/check-conflicts`, appointmentData).pipe(
      tap(response => console.log('Conflict check response:', response)),
      catchError(error => {
        console.error('Conflict check error:', error);
        throw error;
      })
    );
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

  /**
   * Emergency cancel appointment (bypass time restrictions)
   */
  emergencyCancelAppointment(id: number, reason: string): Observable<Appointment> {
    return this.http.post<{success: boolean, message: string, data: any}>(`${this.baseUrl}/appointments/${id}/emergency-cancel`, { reason })
      .pipe(map(response => this.mapper.mapApiResponseToAppointment(response.data.appointment)));
  }
}
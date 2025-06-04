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
    // Using the correct backend endpoint for blocking time slots with correct field names
    return this.http.post(`${this.baseUrl}/appointments/time-slots/block`, {
      start_datetime: startTime,
      end_datetime: endTime,
      reason
    });
  }// Create new appointment
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
  }
  // Update blocked time slot (delete old and create new)
  updateBlockedTimeSlot(id: number, startTime: string, endTime: string, reason: string): Observable<any> {
    // For now, we'll delete the old one and create a new one
    // In a real implementation, you might have a PUT endpoint
    return this.http.put(`${this.baseUrl}/appointments/time-slots/blocked/${id}`, {
      start_datetime: startTime,
      end_datetime: endTime,
      reason
    });
  }// Patient search for appointments
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
}
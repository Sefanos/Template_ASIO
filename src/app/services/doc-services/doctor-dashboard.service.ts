import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// API Response Interfaces
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

export interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
}

export interface TodayAppointment {
  id: number;
  patient_name: string;
  scheduled_time: string;
  status: string;
  appointment_type: string;
  duration?: number;
}

export interface Appointment {
  id: number;
  patient_name: string;
  patient_id: number;
  appointment_type: string;
  scheduled_date: string;
  scheduled_time: string;
  status: string;
  duration?: number;
  notes?: string;
  reason?: string;
}

export interface Patient {
  id: number;
  user_id: number;
  registration_date: string;
  total_appointments: number;
  upcoming_appointments: number;
  critical_alerts_count: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    status: string;
  };
  personal_info: {
    patient_id: number;
    name: string;
    surname: string;
    birthdate: string;
    gender: string;
  };
}

export interface AppointmentStats {
  today: number;
  week: number;
  month: number;
  completion_rate: number;
  no_show_rate: number;
  average_duration: number;
  total_scheduled?: number;
  completed?: number;
  cancelled?: number;
  no_shows?: number;
}

// Dashboard Statistics Interface
export interface DashboardStats {
  todayAppointments: {
    count: number;
    appointments: TodayAppointment[];
  };
  totalPatients: {
    count: number;
    newThisWeek: number;
    criticalAlerts: number;
  };
  appointmentStats: AppointmentStats;
}

// ✅ NEW: Patient Demographics Interfaces
export interface GenderDemographics {
  male: number;
  female: number;
  other: number;
  not_specified: number;
  total_patients: number;
  percentages: {
    male: number;
    female: number;
    other: number;
    not_specified?: number;
  };
}

export interface AgeDemographics {
  age_groups: {
    '0-17': number;
    '18-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76+': number;
  };
  total_patients: number;
  average_age: number;
  percentages: {
    '0-17': number;
    '18-30': number;
    '31-45': number;
    '46-60': number;
    '61-75': number;
    '76+': number;
  };
}

export interface DemographicsOverview {
  overview: {
    total_patients: number;
    new_this_month: number;
    growth_rate: number;
  };
  gender_distribution: GenderDemographics;
  age_distribution: AgeDemographics;
  generated_at: string;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorDashboardService {
  private apiUrl = environment.apiUrl;
  
  // Caching system
  private cache = new Map<string, { data: any; timestamp: number }>();
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes in milliseconds

  constructor(private http: HttpClient) {}
  /**
   * Get HTTP headers with auth token
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }
  /**
   * Check if cached data is still valid
   */
  private isCacheValid(key: string): boolean {
    const cached = this.cache.get(key);
    if (!cached) return false;
    
    const isValid = (Date.now() - cached.timestamp) < this.cacheTimeout;
    if (!isValid) {
      this.cache.delete(key); // Clean up expired cache
    }
    return isValid;
  }

  /**
   * Get cached data
   */
  private getCachedData<T>(key: string): T | null {
    if (this.isCacheValid(key)) {
      const cached = this.cache.get(key);
      return cached?.data || null;
    }
    return null;
  }

  /**
   * Set cached data
   */
  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
  /**
   * Clear specific cache or all cache
   */
  public clearCache(key?: string): void {
    if (key) {
      this.cache.delete(key);
      console.log(`🗑️ Cleared cache for: ${key}`);
    } else {
      this.cache.clear();
      console.log('🗑️ Cleared all cache');
    }
  }

  /**
   * Force refresh dashboard data (clears cache and refetches)
   */
  public refreshDashboard(): Observable<DashboardStats> {
    this.clearCache(); // Clear all cache
    return this.getDashboardStats(); // This will fetch fresh data
  }

  /**
   * Force refresh specific data type
   */
  public refreshData(dataType: 'appointments' | 'patients' | 'stats' | 'user'): Observable<any> {
    switch (dataType) {
      case 'appointments':
        this.clearCache('upcoming-appointments');
        return this.getUpcomingAppointments();
      case 'patients':
        this.clearCache('my-patients');
        return this.getMyPatients();
      case 'stats':
        this.clearCache('appointment-stats');
        return this.getAppointmentStats();
      case 'user':
        this.clearCache('current-user');
        return this.getCurrentUser();
      default:
        throw new Error('Invalid data type');
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('API Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.error?.errors) {
      errorMessage = Object.values(error.error.errors).flat().join(', ');
    } else if (error.message) {
      errorMessage = error.message;
    }

    return throwError(() => new Error(errorMessage));
  }
  /**
   * Get current user information
   */
  getCurrentUser(): Observable<UserInfo> {
    const cacheKey = 'current-user';
    
    // Check cache first
    const cachedData = this.getCachedData<UserInfo>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    console.log('🔄 Loading fresh user data...');
    
    return this.http.get<ApiResponse<UserInfo>>(`${this.apiUrl}/auth/me`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const userData = response.data;
          this.setCachedData(cacheKey, userData); // Cache the result
          return userData;
        }
        throw new Error(response.message || 'Failed to get user info');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get today's appointments
   */
  getTodayAppointments(): Observable<TodayAppointment[]> {
    return this.http.get<ApiResponse<TodayAppointment[]>>(`${this.apiUrl}/doctor/appointments/schedule/today`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          return response.data || [];
        }
        throw new Error(response.message || 'Failed to get today\'s appointments');
      }),
      catchError(this.handleError)
    );
  }  /**
   * Get doctor's patients list
   */
  getMyPatients(): Observable<Patient[]> {
    const cacheKey = 'my-patients';
    
    // Check cache first
    const cachedData = this.getCachedData<Patient[]>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    console.log('🔄 Loading fresh patients data...');
    
    return this.http.get<ApiResponse<Patient[]>>(`${this.apiUrl}/doctor/patients/my-patients`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        console.log('🔍 getMyPatients raw response:', response);
        if (response.success) {
          console.log('✅ getMyPatients data:', response.data);
          const patients = response.data || [];
          this.setCachedData(cacheKey, patients); // Cache the result
          return patients;
        }
        throw new Error(response.message || 'Failed to get patients');
      }),
      catchError(this.handleError)
    );
  }
  /**
   * Get appointment statistics
   */
  getAppointmentStats(): Observable<AppointmentStats> {
    const cacheKey = 'appointment-stats';
    
    // Check cache first
    const cachedData = this.getCachedData<AppointmentStats>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    console.log('🔄 Loading fresh appointment stats...');
    
    return this.http.get<ApiResponse<AppointmentStats>>(`${this.apiUrl}/doctor/appointments/stats`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const stats = response.data;
          this.setCachedData(cacheKey, stats); // Cache the result
          return stats;
        }
        throw new Error(response.message || 'Failed to get appointment stats');
      }),
      catchError(this.handleError)
    );
  }/**
   * Get upcoming appointments
   */
  getUpcomingAppointments(): Observable<Appointment[]> {
    const cacheKey = 'upcoming-appointments';
    
    // Check cache first
    const cachedData = this.getCachedData<Appointment[]>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    console.log('🔄 Loading fresh appointments data...');
    
    return this.http.get<ApiResponse<Appointment[]>>(`${this.apiUrl}/doctor/appointments/upcoming`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const appointments = response.data || [];
          this.setCachedData(cacheKey, appointments); // Cache the result
          return appointments;
        }
        throw new Error(response.message || 'Failed to get upcoming appointments');
      }),
      catchError(this.handleError)
    );
  }/**
   * Get dashboard statistics (combines multiple endpoints)
   */
  getDashboardStats(): Observable<DashboardStats> {
    const cacheKey = 'dashboard-stats';
      // Check cache first
    const cachedData = this.getCachedData<DashboardStats>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }
    
    return new Observable(observer => {
      const stats: Partial<DashboardStats> = {};
      let completed = 0;
      const total = 3;

      const checkCompletion = () => {
        completed++;
        if (completed === total) {
          const finalStats = stats as DashboardStats;
          this.setCachedData(cacheKey, finalStats); // Cache the result
          observer.next(finalStats);
          observer.complete();
        }
      };

      const handleError = (error: any) => {
        observer.error(error);
      };

      // Get today's appointments
      this.getTodayAppointments().subscribe({
        next: (appointments) => {
          stats.todayAppointments = {
            count: appointments.length,
            appointments: appointments
          };
          checkCompletion();
        },
        error: handleError
      });      // Get patients
      this.getMyPatients().subscribe({
        next: (patientsResponse: any) => {
          // Handle different response formats
          let patients: any[] = [];
          
          if (Array.isArray(patientsResponse)) {
            patients = patientsResponse;
          } else if (patientsResponse && Array.isArray(patientsResponse.data)) {
            patients = patientsResponse.data;
          } else if (patientsResponse && typeof patientsResponse === 'object') {
            // If it's an object, try to find an array property
            const possibleArrays = Object.values(patientsResponse).filter(value => Array.isArray(value));
            if (possibleArrays.length > 0) {
              patients = possibleArrays[0] as any[];
            }
          }
          
          console.log('Dashboard service - processed patients:', patients);
          
          if (!Array.isArray(patients)) {
            console.warn('Patients data is not an array in dashboard service:', patientsResponse);
            patients = [];
          }
          
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
          
          const newThisWeek = patients.filter(patient => 
            new Date(patient.registration_date) >= oneWeekAgo
          ).length;

          const criticalAlerts = patients.reduce((sum, patient) => 
            sum + (patient.critical_alerts_count || 0), 0
          );

          stats.totalPatients = {
            count: patients.length,
            newThisWeek: newThisWeek,
            criticalAlerts: criticalAlerts
          };
          checkCompletion();
        },
        error: handleError
      });

      // Get appointment stats
      this.getAppointmentStats().subscribe({
        next: (appointmentStats) => {
          stats.appointmentStats = appointmentStats;
          checkCompletion();
        },
        error: handleError      });
    });
  }

  /**
   * ✅ NEW: Get gender demographics for doctor's patients
   */
  getGenderDemographics(): Observable<GenderDemographics> {
    const cacheKey = 'gender-demographics';
    
    // Check cache first
    const cachedData = this.getCachedData<GenderDemographics>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<ApiResponse<GenderDemographics>>(`${this.apiUrl}/doctor/patients/demographics/gender`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const demographics = response.data;
          this.setCachedData(cacheKey, demographics);
          return demographics;
        }
        throw new Error(response.message || 'Failed to get gender demographics');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NEW: Get age demographics for doctor's patients
   */
  getAgeDemographics(): Observable<AgeDemographics> {
    const cacheKey = 'age-demographics';
    
    // Check cache first
    const cachedData = this.getCachedData<AgeDemographics>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<ApiResponse<AgeDemographics>>(`${this.apiUrl}/doctor/patients/demographics/age`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const demographics = response.data;
          this.setCachedData(cacheKey, demographics);
          return demographics;
        }
        throw new Error(response.message || 'Failed to get age demographics');
      }),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ NEW: Get complete demographics overview for doctor's patients
   */
  getDemographicsOverview(): Observable<DemographicsOverview> {
    const cacheKey = 'demographics-overview';
    
    // Check cache first
    const cachedData = this.getCachedData<DemographicsOverview>(cacheKey);
    if (cachedData) {
      return of(cachedData);
    }

    return this.http.get<ApiResponse<DemographicsOverview>>(`${this.apiUrl}/doctor/patients/demographics/overview`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const overview = response.data;
          this.setCachedData(cacheKey, overview);
          return overview;
        }
        throw new Error(response.message || 'Failed to get demographics overview');
      }),
      catchError(this.handleError)
    );
  }
}

import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map, tap, retry, delay } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interface for basic patient information
 */
export interface PatientInfo {
  id: number;
  name: string;
  email: string;
  phone: string;
  age: number;
  gender: string;
  birthdate: string;
  registration_date: string;
  status: string;
  profile_image?: string;
}

/**
 * Interface for medical summary overview
 */
export interface MedicalOverview {
  total_visits: number;
  upcoming_appointments: number;
  active_medications: number;
  allergies: number;
  recent_lab_results: number;
  active_conditions: number;
  last_visit_date: string;
}

/**
 * Interface for timeline events
 */
export interface TimelineEvent {
  id: number;
  event_type: 'appointment' | 'medication' | 'lab_result' | 'vital_signs' | 'note';
  title: string;
  description: string;
  date: string;
  doctor_name?: string;
  doctor_id?: number;
  category?: string;
  status?: string;
  is_critical?: boolean;
}

/**
 * Interface for vital signs summary
 */
export interface VitalSignsSummary {
  last_recorded: string;
  blood_pressure?: {
    systolic: number;
    diastolic: number;
    status: 'normal' | 'elevated' | 'high' | 'critical';
  };
  heart_rate?: {
    value: number;
    status: 'normal' | 'elevated' | 'low' | 'critical';
  };
  temperature?: {
    value: number;
    unit: 'celsius' | 'fahrenheit';
    status: 'normal' | 'elevated' | 'low' | 'critical';
  };
  oxygen_saturation?: {
    value: number;
    status: 'normal' | 'low' | 'critical';
  };
  respiratory_rate?: {
    value: number;
    status: 'normal' | 'elevated' | 'low' | 'critical';
  };
}

/**
 * Interface for current medications summary
 */
export interface MedicationsSummary {
  total_active: number;
  recent_changes: number;
  has_conflicts: boolean;
  has_allergies: boolean;
  requires_renewal: number;
}

/**
 * Interface for complete patient medical summary
 */
export interface PatientMedicalSummary {
  patient: PatientInfo;
  medical_summary: MedicalOverview;
  recent_activities: TimelineEvent[];
  vital_signs_summary: VitalSignsSummary;
  medications_summary: MedicationsSummary;
  alerts_count: number;
}

/**
 * Interface for vital signs data
 */
export interface VitalSignsData {
  current: {
    blood_pressure: {
      systolic: number;
      diastolic: number;
      status: 'normal' | 'elevated' | 'high' | 'critical';
    };
    heart_rate: {
      value: number;
      status: 'normal' | 'elevated' | 'low';
    };
    temperature: {
      value: number;
      unit: 'celsius' | 'fahrenheit';
      status: 'normal' | 'elevated' | 'low';
    };
    oxygen_saturation: {
      value: number;
      status: 'normal' | 'low';
    };
    respiratory_rate: {
      value: number;
      status: 'normal' | 'elevated' | 'low';
    };
    weight: {
      value: number;
      unit: 'kg' | 'lb';
    };
    height: {
      value: number;
      unit: 'cm' | 'in';
    };
    bmi: {
      value: number;
      status: 'underweight' | 'normal' | 'overweight' | 'obese';
    };
    pain_level?: {
      value: number;
      scale: '0-10';
    };
  };
  history: {
    id: number;
    recorded_at: string;
    doctor_id: number;
    doctor_name: string;
    blood_pressure?: {
      systolic: number;
      diastolic: number;
    };
    heart_rate?: number;
    temperature?: {
      value: number;
      unit: 'celsius' | 'fahrenheit';
    };
    oxygen_saturation?: number;
    respiratory_rate?: number;
    weight?: {
      value: number;
      unit: 'kg' | 'lb';
    };
    height?: {
      value: number;
      unit: 'cm' | 'in';
    };
    bmi?: number;
    pain_level?: number;
    notes?: string;
  }[];
  trends: {
    blood_pressure: 'improving' | 'stable' | 'worsening';
    heart_rate: 'improving' | 'stable' | 'worsening';
    weight: 'improving' | 'stable' | 'worsening' | 'fluctuating';
  };
  last_updated: string;
}

/**
 * Interface for medication data
 */
export interface Medication {
  id: number;
  name: string;
  dosage: string;
  frequency: string;
  start_date: string;
  end_date?: string;
  doctor_id: number;
  doctor_name: string;
  notes?: string;
  purpose?: string;
  is_active: boolean;
  refills_remaining?: number;
  next_refill_date?: string;
  has_conflicts: boolean;
  conflicts_with?: string[];
}

/**
 * Interface for medication allergies
 */
export interface Allergy {
  id: number;
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'unknown';
  diagnosed_date: string;
}

/**
 * Interface for medication data response
 */
export interface MedicationData {
  current_medications: Medication[];
  past_medications: Medication[];
  allergies: Allergy[];
  medication_history: {
    date: string;
    action: 'prescribed' | 'discontinued' | 'modified';
    medication_name: string;
    doctor_name: string;
    notes?: string;
  }[];
}

/**
 * Interface for patient statistics
 */
export interface PatientStatistics {
  appointments: {
    total: number;
    completed: number;
    upcoming: number;
    cancelled: number;
    chart: {
      labels: string[];
      data: number[];
    };
  };
  vitals: {
    blood_pressure: {
      labels: string[];
      systolic: number[];
      diastolic: number[];
    };
    heart_rate: {
      labels: string[];
      data: number[];
    };
    weight: {
      labels: string[];
      data: number[];
    };
  };
  medications: {
    total_prescribed: number;
    currently_active: number;
    adherence_rate?: number;
  };
  lab_results: {
    total_tests: number;
    abnormal_results: number;
    recent_tests: number;
  };
}

/**
 * Service for handling patient medical record API interactions
 */
@Injectable({
  providedIn: 'root'
})
export class PatientMedicalService {
  private apiUrl = environment.apiUrl;
  private cache = new Map<string, { data: any; timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {}

  /**
   * Get authentication headers
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Get patient medical summary - Main overview data
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */  getPatientMedicalSummary(patientId: number, forceRefresh = false): Observable<PatientMedicalSummary> {
    const cacheKey = this.getCacheKey('summary', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      console.log('Returning cached data for patient:', patientId);
      return of(this.cache.get(cacheKey)!.data);
    }
    
    console.log(`Fetching medical summary for patient ${patientId} from API`);
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/summary`, {
      headers: this.getHeaders()
    }).pipe(
      retry({
        count: 2,
        delay: (error, retryCount) => {
          console.log(`Retry attempt ${retryCount} for patient ${patientId}:`, error);
          return of(null).pipe(delay(1000 * retryCount)); // Exponential backoff
        }
      }),
      tap(data => {
        console.log(`Successfully fetched data for patient ${patientId}:`, data);
        this.setCache(cacheKey, data);
      }),
      map(response => this.transformSummaryData(response)),
      catchError(this.handleError<any>('getPatientMedicalSummary', null))
    );
  }

  /**
   * Get patient vital signs data
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientVitals(patientId: number, forceRefresh = false): Observable<VitalSignsData> {
    const cacheKey = this.getCacheKey('vitals', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/vitals`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      map(response => this.transformVitalsData(response)),
      catchError(this.handleError<any>('getPatientVitals', null))
    );
  }

  /**
   * Get patient medications data
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientMedications(patientId: number, forceRefresh = false): Observable<MedicationData> {
    const cacheKey = this.getCacheKey('medications', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/medications`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      map(response => this.transformMedicationsData(response)),
      catchError(this.handleError<any>('getPatientMedications', null))
    );
  }

  /**
   * Get patient lab results
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientLabResults(patientId: number, forceRefresh = false): Observable<any> {
    const cacheKey = this.getCacheKey('lab-results', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/lab-results`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError<any>('getPatientLabResults', null))
    );
  }

  /**
   * Get patient medical history
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientMedicalHistory(patientId: number, forceRefresh = false): Observable<any> {
    const cacheKey = this.getCacheKey('medical-history', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/medical-history`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError<any>('getPatientMedicalHistory', null))
    );
  }

  /**
   * Get patient timeline events
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientTimeline(patientId: number, forceRefresh = false): Observable<TimelineEvent[]> {
    const cacheKey = this.getCacheKey('timeline', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/timeline`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      map(response => response.data || []),
      catchError(this.handleError<any>('getPatientTimeline', []))
    );
  }

  /**
   * Get patient notes
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientNotes(patientId: number, forceRefresh = false): Observable<any> {
    const cacheKey = this.getCacheKey('notes', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/notes`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError<any>('getPatientNotes', null))
    );
  }

  /**
   * Get patient alerts
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientAlerts(patientId: number, forceRefresh = false): Observable<any> {
    const cacheKey = this.getCacheKey('alerts', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/alerts`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError<any>('getPatientAlerts', null))
    );
  }

  /**
   * Get patient files
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientFiles(patientId: number, forceRefresh = false): Observable<any> {
    const cacheKey = this.getCacheKey('files', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/files`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      catchError(this.handleError<any>('getPatientFiles', null))
    );
  }

  /**
   * Get patient statistics
   * @param patientId Patient ID
   * @param forceRefresh Force refresh data from API
   */
  getPatientStatistics(patientId: number, forceRefresh = false): Observable<PatientStatistics> {
    const cacheKey = this.getCacheKey('statistics', patientId);
    
    if (!forceRefresh && this.isCacheValid(cacheKey)) {
      return of(this.cache.get(cacheKey)!.data);
    }
    
    return this.http.get<any>(`${this.apiUrl}/patients/${patientId}/medical/statistics`, {
      headers: this.getHeaders()
    }).pipe(
      tap(data => this.setCache(cacheKey, data)),
      map(response => response.data),
      catchError(this.handleError<any>('getPatientStatistics', null))
    );
  }

  /**
   * Get cache key for patient data
   * @param endpoint API endpoint
   * @param patientId Patient ID
   */
  private getCacheKey(endpoint: string, patientId: number): string {
    return `patient-${patientId}-${endpoint}`;
  }

  /**
   * Check if cache is valid
   * @param cacheKey Cache key
   */
  private isCacheValid(cacheKey: string): boolean {
    if (!this.cache.has(cacheKey)) {
      return false;
    }
    
    const entry = this.cache.get(cacheKey)!;
    return Date.now() - entry.timestamp < this.CACHE_DURATION;
  }

  /**
   * Set cache data
   * @param cacheKey Cache key
   * @param data Data to cache
   */
  private setCache(cacheKey: string, data: any): void {
    this.cache.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear patient cache
   * @param patientId Patient ID
   */
  clearPatientCache(patientId: number): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((value, key) => {
      if (key.startsWith(`patient-${patientId}`)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Transform API summary response to PatientMedicalSummary interface
   * @param response API response
   */
  private transformSummaryData(response: any): PatientMedicalSummary {
    // If the API returns data in a different format, transform it here
    // For now, assuming the API returns data in the expected format
    if (response.success && response.data) {
      return response.data;
    }
    
    return response; // If API already returns the expected structure
  }

  /**
   * Transform API vitals response to VitalSignsData interface
   * @param response API response
   */
  private transformVitalsData(response: any): VitalSignsData {
    // Transform API response to VitalSignsData interface
    if (response.success && response.data) {
      return response.data;
    }
    
    return response;
  }

  /**
   * Transform API medications response to MedicationData interface
   * @param response API response
   */
  private transformMedicationsData(response: any): MedicationData {
    // Transform API response to MedicationData interface
    if (response.success && response.data) {
      return response.data;
    }
    
    return response;
  }  /**
   * Handle HTTP operation that failed
   * @param operation Name of the operation that failed
   * @param result Optional value to return as the observable result
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      console.error(`${operation} failed:`, error);
      
      // Log more details about the error
      if (error.status) {
        console.error(`HTTP Status: ${error.status}`);
        console.error(`Error message: ${error.message}`);
        if (error.error) {
          console.error(`Server response:`, error.error);
        }
      }
      
      // Re-throw the error so components can handle it properly
      throw error;
    };
  }
}

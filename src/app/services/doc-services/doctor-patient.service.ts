import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError, of, BehaviorSubject } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// ✅ My Patients Interfaces (Rich Data from /api/doctor/patients/my-patients)
export interface DoctorPatientUser {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
}

export interface DoctorPatientPersonalInfo {
  patient_id: number;
  name: string;
  surname: string;
  birthdate: string;
  gender: 'male' | 'female' | 'other';
}

export interface MyPatient {
  id: number;
  user_id: number;
  registration_date: string;
  created_at: string;
  updated_at: string;
  total_appointments: number;
  upcoming_appointments: number;
  critical_alerts_count: number;
  user: DoctorPatientUser;
  personal_info: DoctorPatientPersonalInfo;
  // Calculated fields
  age: number;
  fullName: string;
  lastVisit: string | null;
}

// ✅ All Patients Interfaces (Basic Data from /api/patients)
export interface AllPatient {
  id: number;
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive' | 'suspended';
  created_at: string;
  updated_at: string;
  // Calculated fields
  age?: number;
  registrationDate: string;
}

// ✅ API Response Interfaces
export interface MyPatientsPagination {
  current_page: number;
  data: MyPatient[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: Array<{
    url: string | null;
    label: string;
    active: boolean;
  }>;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

export interface MyPatientsResponse {
  success: boolean;
  data: MyPatientsPagination;
  message?: string;
}

export interface AllPatientsResponse {
  success: boolean;
  message: string;
  data: {
    items: any[];
    pagination: {
      total: number;
      current_page: number;
      per_page: number;
      last_page: number;
    };
  };
}

// ✅ Search and Filter Interfaces
export interface PatientSearchFilters {
  status?: string;
  gender?: string;
  ageRange?: [number, number];
}

export interface PatientSearchParams {
  search?: string;
  filters?: PatientSearchFilters;
}

// ✅ Cache Interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiryTime: number;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorPatientService {
  private readonly apiUrl = environment.apiUrl;
  private readonly cacheExpiry = 5 * 60 * 1000; // 5 minutes
  private cache = new Map<string, CacheEntry<any>>();

  // State management
  private myPatientsSubject = new BehaviorSubject<MyPatient[]>([]);
  private allPatientsSubject = new BehaviorSubject<AllPatient[]>([]);
  private loadingSubject = new BehaviorSubject<{myPatients: boolean, allPatients: boolean}>({
    myPatients: false,
    allPatients: false
  });

  // Observables
  public myPatients$ = this.myPatientsSubject.asObservable();
  public allPatients$ = this.allPatientsSubject.asObservable();
  public loading$ = this.loadingSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get HTTP headers with authentication
   */
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    });
  }

  /**
   * Generic cache management
   */
  private getCachedData<T>(key: string): T | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() < cached.expiryTime) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData<T>(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      expiryTime: Date.now() + this.cacheExpiry
    });
  }

  /**
   * Calculate age from birthdate
   */
  private calculateAge(birthdate: string): number {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Transform API response to MyPatient interface
   */
  private transformToMyPatient(apiData: any): MyPatient {
    return {
      ...apiData,
      age: this.calculateAge(apiData.personal_info.birthdate),
      fullName: `${apiData.personal_info.name} ${apiData.personal_info.surname}`,
      lastVisit: this.calculateLastVisit(apiData.total_appointments, apiData.updated_at)
    };
  }

  /**
   * Transform API response to AllPatient interface
   */
  private transformToAllPatient(apiData: any): AllPatient {
    return {
      id: apiData.id,
      name: apiData.name,
      email: apiData.email,
      phone: apiData.phone,
      status: apiData.status,
      created_at: apiData.created_at,
      updated_at: apiData.updated_at,
      age: undefined, // No birthdate in basic API
      registrationDate: this.formatDate(apiData.created_at)
    };
  }

  /**
   * Calculate last visit info
   */
  private calculateLastVisit(totalAppointments: number, lastUpdate: string): string | null {
    if (totalAppointments === 0) return 'Never';
    
    const lastDate = new Date(lastUpdate);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1 day ago';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`;
    return `${Math.ceil(diffDays / 30)} months ago`;
  }

  /**
   * Format date for display
   */
  private formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: any): Observable<never> {
    console.error('DoctorPatientService error:', error);
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error?.message) {
      errorMessage = error.error.message;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return throwError(() => new Error(errorMessage));
  }
  /**
   * ✅ Get doctor's assigned patients (rich data) with pagination
   */
  getMyPatients(page: number = 1, limit: number = 20, forceRefresh: boolean = false): Observable<{patients: MyPatient[], pagination: any}> {
    const cacheKey = `my-patients-${page}-${limit}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedData = this.getCachedData<{patients: MyPatient[], pagination: any}>(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    }

    // Set loading state
    this.loadingSubject.next({
      ...this.loadingSubject.value,
      myPatients: true
    });

    return this.http.get<MyPatientsResponse>(`${this.apiUrl}/doctor/patients/my-patients?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const transformedData = response.data.data.map(patient => 
            this.transformToMyPatient(patient)
          );
            const result = {
            patients: transformedData,
            pagination: {
              current_page: response.data.current_page,
              last_page: response.data.last_page,
              per_page: response.data.per_page,
              total: response.data.total,
              from: response.data.from,
              to: response.data.to
            }
          };
          
          // Cache the result
          this.setCachedData(cacheKey, result);
          
          // Update subject (only for first page to maintain compatibility)
          if (page === 1) {
            this.myPatientsSubject.next(transformedData);
          }
          
          return result;
        }
        throw new Error(response.message || 'Failed to get my patients');
      }),
      tap(() => {
        // Clear loading state
        this.loadingSubject.next({
          ...this.loadingSubject.value,
          myPatients: false
        });
      }),
      catchError((error) => {
        this.loadingSubject.next({
          ...this.loadingSubject.value,
          myPatients: false
        });
        return this.handleError(error);
      })
    );
  }

  /**
   * ✅ Get all patients (basic data) with pagination  
   */
  getAllPatients(page: number = 1, limit: number = 20, forceRefresh: boolean = false): Observable<{patients: AllPatient[], pagination: any}> {
    const cacheKey = `all-patients-${page}-${limit}`;
    
    // Check cache first
    if (!forceRefresh) {
      const cachedData = this.getCachedData<{patients: AllPatient[], pagination: any}>(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    }

    // Set loading state
    this.loadingSubject.next({
      ...this.loadingSubject.value,
      allPatients: true
    });

    return this.http.get<AllPatientsResponse>(`${this.apiUrl}/patients?page=${page}&limit=${limit}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => {
        if (response.success) {
          const transformedData = response.data.items.map(patient => 
            this.transformToAllPatient(patient)
          );
          
          const result = {
            patients: transformedData,
            pagination: {
              current_page: response.data.pagination.current_page,
              last_page: response.data.pagination.last_page,
              per_page: response.data.pagination.per_page,
              total: response.data.pagination.total
            }
          };
          
          // Cache the result
          this.setCachedData(cacheKey, result);
          
          // Update subject (only for first page to maintain compatibility)
          if (page === 1) {
            this.allPatientsSubject.next(transformedData);
          }
          
          return result;
        }
        throw new Error(response.message || 'Failed to get all patients');
      }),
      tap(() => {
        // Clear loading state
        this.loadingSubject.next({
          ...this.loadingSubject.value,
          allPatients: false
        });
      }),
      catchError((error) => {
        this.loadingSubject.next({
          ...this.loadingSubject.value,
          allPatients: false
        });
        return this.handleError(error);
      })
    );
  }

  /**
   * ✅ Backward compatibility methods (for components that don't use pagination yet)
   */
  getMyPatientsSimple(forceRefresh: boolean = false): Observable<MyPatient[]> {
    return this.getMyPatients(1, 20, forceRefresh).pipe(
      map(result => result.patients)
    );
  }

  getAllPatientsSimple(forceRefresh: boolean = false): Observable<AllPatient[]> {
    return this.getAllPatients(1, 20, forceRefresh).pipe(
      map(result => result.patients)
    );
  }

  /**
   * ✅ Search within my patients (frontend filtering)
   */
  searchMyPatients(searchTerm: string, filters: PatientSearchFilters = {}): MyPatient[] {
    const patients = this.myPatientsSubject.value;
    
    return patients.filter(patient => {
      // Text search (name, email, phone)
      const matchesSearch = !searchTerm || 
        patient.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.user.phone.includes(searchTerm);
      
      // Status filter
      const matchesStatus = !filters.status || patient.user.status === filters.status;
      
      // Gender filter
      const matchesGender = !filters.gender || patient.personal_info.gender === filters.gender;
      
      // Age range filter
      const matchesAge = !filters.ageRange || 
        (patient.age >= filters.ageRange[0] && patient.age <= filters.ageRange[1]);
      
      return matchesSearch && matchesStatus && matchesGender && matchesAge;
    });
  }

  /**
   * ✅ Search within all patients (frontend filtering)
   */
  searchAllPatients(searchTerm: string, filters: PatientSearchFilters = {}): AllPatient[] {
    const patients = this.allPatientsSubject.value;
    
    return patients.filter(patient => {
      // Text search (name, email, phone)
      const matchesSearch = !searchTerm || 
        patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        patient.phone.includes(searchTerm);
      
      // Status filter
      const matchesStatus = !filters.status || patient.status === filters.status;
      
      // Age range filter (if age is available)
      const matchesAge = !filters.ageRange || !patient.age ||
        (patient.age >= filters.ageRange[0] && patient.age <= filters.ageRange[1]);
      
      return matchesSearch && matchesStatus && matchesAge;
    });
  }

  /**
   * ✅ Get detailed patient information (for read-only access)
   */
  getPatientDetails(patientId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/patients/${patientId}`, {
      headers: this.getHeaders()
    }).pipe(
      map(response => response),
      catchError(this.handleError)
    );
  }

  /**
   * ✅ Clear cache (useful for testing or forced refresh)
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * ✅ Get cache info (for debugging)
   */
  getCacheInfo(): { key: string; size: number; expiresIn: number }[] {
    const info: { key: string; size: number; expiresIn: number }[] = [];
    
    this.cache.forEach((value, key) => {
      info.push({
        key,
        size: JSON.stringify(value.data).length,
        expiresIn: Math.max(0, value.expiryTime - Date.now())
      });
    });
    
    return info;
  }
}

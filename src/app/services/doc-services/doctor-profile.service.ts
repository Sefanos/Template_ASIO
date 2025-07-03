import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// Doctor Profile Interfaces
export interface DoctorProfile {
  id: number;
  user_id: number;
  name: string;
  email: string;
  phone?: string;
  profile_image?: string;
  license_number?: string;
  specialty?: string;
  experience_years?: number;
  consultation_fee?: string;
  is_available?: boolean;
  working_hours?: {
    [day: string]: string[] | null;
  };
  max_patient_appointments?: number;
  created_at?: string;
  updated_at?: string;
  // Legacy fields for backward compatibility
  specialty_id?: number;
  years_of_experience?: number;
  education?: string;
  bio?: string;
  emergency_contact?: string;
  office_address?: string;
  languages_spoken?: string;
  certifications?: string;
  availability_status?: 'available' | 'busy' | 'unavailable';
  // Related data
  user?: {
    id: number;
    name: string;
    email: string;
    phone?: string;
  };
  specialty_obj?: {
    id: number;
    name: string;
    description?: string;
  };
}

export interface Specialty {
  id: number;
  name: string;
  description?: string;
}

// For handling the API response that returns string arrays
export interface SpecialtyApiResponse {
  success: boolean;
  message: string;
  data: string[];
}

export interface UpdateDoctorProfileRequest {
  specialty_id?: number;
  license_number?: string;
  years_of_experience?: number;
  education?: string;
  bio?: string;
  consultation_fee?: number;
  phone?: string;
  emergency_contact?: string;
  office_address?: string;
  working_hours?: string;
  languages_spoken?: string;
  certifications?: string;
  availability_status?: 'available' | 'busy' | 'unavailable';
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any;
}

@Injectable({
  providedIn: 'root'
})
export class DoctorProfileService {
  private readonly baseUrl = `${environment.apiUrl}/doctor/profile`;
  private readonly specialtiesUrl = `${environment.apiUrl}/specialties`;

  constructor(private http: HttpClient) {}

  /**
   * Get doctor's profile information
   */
  getProfile(): Observable<DoctorProfile> {
    return this.http.get<ApiResponse<DoctorProfile>>(this.baseUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to get doctor profile');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update doctor's profile information
   */
  updateProfile(profileData: UpdateDoctorProfileRequest): Observable<DoctorProfile> {
    return this.http.put<ApiResponse<DoctorProfile>>(this.baseUrl, profileData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            return response.data;
          }
          throw new Error(response.message || 'Failed to update doctor profile');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Update doctor's profile image
   */
  updateProfileImage(imageFile: File): Observable<DoctorProfile> {
    const formData = new FormData();
    formData.append('image', imageFile);

    return this.http.post<ApiResponse<DoctorProfile>>(`${this.baseUrl}/image`, formData)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Backend now returns the full updated profile
            return response.data;
          }
          throw new Error(response.message || 'Failed to update profile image');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Get available specialties
   */
  getSpecialties(): Observable<Specialty[]> {
    return this.http.get<SpecialtyApiResponse>(this.specialtiesUrl)
      .pipe(
        map(response => {
          if (response.success && response.data) {
            // Convert string array to Specialty objects with fake IDs
            return response.data.map((name: string, index: number) => ({
              id: index + 1,
              name: name,
              description: name
            }));
          }
          throw new Error(response.message || 'Failed to get specialties');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Test endpoint connectivity
   */
  testConnection(): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/test`)
      .pipe(
        map(response => {
          if (response.success) {
            return response;
          }
          throw new Error(response.message || 'Test failed');
        }),
        catchError(this.handleError)
      );
  }

  /**
   * Error handler
   */
  private handleError(error: any): Observable<never> {
    console.error('DoctorProfileService Error:', error);
    
    let errorMessage = 'An unexpected error occurred';
    
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.error && error.error.message) {
      // Backend error with message
      errorMessage = error.error.message;
    } else if (error.error && error.error.errors) {
      // Validation errors
      const validationErrors = error.error.errors;
      const firstError = Object.keys(validationErrors)[0];
      if (firstError && validationErrors[firstError][0]) {
        errorMessage = validationErrors[firstError][0];
      }
    } else if (error.status) {
      // HTTP error
      switch (error.status) {
        case 401:
          errorMessage = 'Unauthorized: Please log in again';
          break;
        case 403:
          errorMessage = 'Forbidden: You do not have permission to access this resource';
          break;
        case 404:
          errorMessage = 'Profile not found';
          break;
        case 422:
          errorMessage = 'Validation error: Please check your input';
          break;
        case 500:
          errorMessage = 'Server error: Please try again later';
          break;
        default:
          errorMessage = `Server error: ${error.status}`;
      }
    }
    
    return throwError(() => new Error(errorMessage));
  }
}

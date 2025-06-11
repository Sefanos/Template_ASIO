import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Patient } from '../domain/models/patient.model';
import { PersonalInfo } from '../domain/models/personal-info.model';

// Generic backend response structure based on ApiResponseTrait
export interface BackendResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  errors?: any; // For Laravel validation errors (e.g., { field: ['message'] })
}

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private baseUrl = 'http://127.0.0.1:8000/api'; // Ensure this is your backend API URL

  private currentPatientSubject = new BehaviorSubject<Patient | null>(null); // Optional state management

  constructor(private http: HttpClient) {}

  getCurrentPatient(): Observable<Patient | null> {
    return this.currentPatientSubject.asObservable();
  }

  setCurrentPatient(patient: Patient): void {
    this.currentPatientSubject.next(patient);
  }

  getCurrentPatientValue(): Patient | null {
    return this.currentPatientSubject.value;
  }

  getProfile(): Observable<BackendResponse<PersonalInfo>> {
    return this.http.get<BackendResponse<PersonalInfo>>(`${this.baseUrl}/patient/profile`);
  }

  // Payload type is Partial<PersonalInfo> but keys might need mapping to snake_case for backend
  updateProfile(payload: any): Observable<BackendResponse<PersonalInfo>> {
    return this.http.put<BackendResponse<PersonalInfo>>(`${this.baseUrl}/patient/profile`, payload);
  }

  updateProfileImage(formData: FormData): Observable<BackendResponse<PersonalInfo>> {
    return this.http.post<BackendResponse<PersonalInfo>>(`${this.baseUrl}/patient/profile/image`, formData);
  }

  // Example, ensure this endpoint and its expected response are defined in your backend
  getPatientDashboard(userId: number): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get(`${this.baseUrl}/patient/dashboard`, { params }); // Verify this route
  }

  changePassword(payload: { current_password: string, new_password: string, new_password_confirmation: string }): Observable<BackendResponse<null>> {
    // Ensure this route exists on your backend and is protected by jwt.auth
    // e.g., Route::post('auth/change-password', [AuthController::class, 'changePassword'])->middleware('jwt.auth');
    return this.http.post<BackendResponse<null>>(`${this.baseUrl}/auth/change-password`, payload);
  }
}
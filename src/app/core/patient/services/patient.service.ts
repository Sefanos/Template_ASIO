import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { Patient } from '../domain/models/patient.model';

@Injectable({
  providedIn: 'root'
})
export class PatientService {
  private baseUrl = 'http://127.0.0.1:8000/api';
  
  // BehaviorSubject to store the current patient
  private currentPatientSubject = new BehaviorSubject<Patient | null>(null);
  
  constructor(private http: HttpClient) {
    // Initialize with a mock patient for development purposes
    // In a real application, you would get this from localStorage or an API call
    const mockPatient: Patient = {
      id: 123,
      name: 'Jean Dupont',
      email: 'jean.dupont@example.com',
      phone: '+33 1 23 45 67 89',
      dob: new Date('1985-05-15'),
      gender: 'Male',
      address: '123 Rue de Paris, 75001 Paris, France',
      insuranceNumber: 'INS123456789',
      emergencyContact: {
        name: 'Marie Dupont',
        phone: '+33 6 12 34 56 78',
        relationship: 'Spouse'
      }
    };
    this.currentPatientSubject.next(mockPatient);
  }
  
  /**
   * Get the current patient information
   * @returns Observable of the current patient
   */
  getCurrentPatient(): Observable<Patient | null> {
    return this.currentPatientSubject.asObservable();
  }
  
  /**
   * Set the current patient
   * @param patient The patient to set as current
   */
  setCurrentPatient(patient: Patient): void {
    this.currentPatientSubject.next(patient);
  }
  
  /**
   * Get the current patient value synchronously
   * @returns The current patient or null
   */
  getCurrentPatientValue(): Patient | null {
    return this.currentPatientSubject.value;
  }
  
  getProfile(): Observable<any> {
    return this.http.get(`${this.baseUrl}/profile`);
  }
  
  updateProfile(payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/profile/update`, payload);
  }
  
  updateProfileImage(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}/profile/update-image`, formData);
  }

  getPatientDashboard(userId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/patient/dashboard/?userId=${userId}`);
  }
  
  changePassword(currentPassword: string, newPassword: string): Observable<{ status: string; message?: string }> {
    const payload = { currentPassword, newPassword };
    return this.http.post<{ status: string; message?: string }>('/api/change-password', payload);
  }
}

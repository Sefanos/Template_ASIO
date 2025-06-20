import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Medication {
  id: number;
  chart_patient_id: number | null;
  doctor_user_id: number;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  start_date: string;
  end_date: string | null;
  instructions: string;
  refills_allowed: string;
  status: string;
  created_at: string;
  updated_at: string;
  patient_id: number;
}

interface DiscontinueRequest {
  reason: string;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class MedicationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('access_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    });
  }

  /**
   * Get all medications for a patient
   */
  async getPatientMedications(patientId: number): Promise<Medication[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/medications?patient_id=${patientId}`, {
          headers: this.getHeaders()
        })
      );
      
      // Handle different API response formats
      if (response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (Array.isArray(response)) {
        return response;
      } else {
        console.warn('Unexpected API response format:', response);
        return [];
      }
    } catch (error) {
      console.error('Error fetching medications:', error);
      throw error;
    }
  }

  /**
   * Discontinue a medication
   */
  async discontinueMedication(medicationId: number, request: DiscontinueRequest): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/medications/${medicationId}/discontinue`, request, {
          headers: this.getHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error discontinuing medication:', error);
      throw error;
    }
  }

  /**
   * Update a medication
   */
  async updateMedication(medicationId: number, medication: Partial<Medication>): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/medications/${medicationId}`, medication, {
          headers: this.getHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error updating medication:', error);
      throw error;
    }
  }

  /**
   * Delete a medication
   */
  async deleteMedication(medicationId: number): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/medications/${medicationId}`, {
          headers: this.getHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error deleting medication:', error);
      throw error;
    }
  }

  /**
   * Add new medication
   */
  async addMedication(medication: Partial<Medication>): Promise<any> {
    try {
      const response = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/medications`, medication, {
          headers: this.getHeaders()
        })
      );
      return response;
    } catch (error) {
      console.error('Error adding medication:', error);
      throw error;
    }
  }
}
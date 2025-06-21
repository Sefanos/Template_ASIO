import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface MedicalHistory {
  id: number;
  patient_id: number;
  conditions: string[];      
  surgeries: string[];         
  chronicDiseases: string[]; 
  medications: string[];     
  allergies: string[];       
  lastUpdated: string;
  updatedBy: string;
}

export interface CreateMedicalHistoryRequest {
  patient_id: number;
  current_medical_conditions: string[];
  past_surgeries: string[];
  chronic_diseases: string[];
  current_medications: string[];
  allergies: string[];
}

// Update the interface to be more strict
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  error?: any;
}

// Add better request validation
export interface UpdateMedicalHistoryRequest {
  patient_id: number;
  current_medical_conditions: string[];
  past_surgeries: string[];
  chronic_diseases: string[];
  current_medications: string[];
  allergies: string[];
}

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
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
   * Get all medical histories for a patient
   */
  async getPatientMedicalHistories(patientId: number): Promise<MedicalHistory[]> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<MedicalHistory[]>>(
          `${this.apiUrl}/patients/${patientId}/medical-histories`,
          { headers: this.getHeaders() }
        )
      );
      
      return response.data || [];
    } catch (error) {
      console.error('Error fetching medical histories:', error);
      throw error;
    }
  }

  /**
   * Get specific medical history
   */
  async getMedicalHistory(patientId: number, historyId: number): Promise<MedicalHistory> {
    try {
      const response = await firstValueFrom(
        this.http.get<ApiResponse<MedicalHistory>>(
          `${this.apiUrl}/patients/${patientId}/medical-histories/${historyId}`,
          { headers: this.getHeaders() }
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error fetching medical history:', error);
      throw error;
    }
  }

  /**
   * Create new medical history
   */
  async createMedicalHistory(request: CreateMedicalHistoryRequest): Promise<MedicalHistory> {
    try {
      const response = await firstValueFrom(
        this.http.post<ApiResponse<MedicalHistory>>(
          `${this.apiUrl}/patients/${request.patient_id}/medical-histories`,
          request,
          { headers: this.getHeaders() }
        )
      );
      
      return response.data;
    } catch (error) {
      console.error('Error creating medical history:', error);
      throw error;
    }
  }

  /**
   * Update medical history
   */
  async updateMedicalHistory(
    patientId: number, 
    historyId: number, 
    request: UpdateMedicalHistoryRequest
  ): Promise<MedicalHistory> {
    try {
      console.log('Service: Updating medical history', { patientId, historyId, request });
      
      // Validate request data
      if (!request.patient_id || !patientId || !historyId) {
        throw new Error('Missing required parameters for update');
      }

      const response = await firstValueFrom(
        this.http.put<ApiResponse<MedicalHistory>>(
          `${this.apiUrl}/patients/${patientId}/medical-histories/${historyId}`,
          request,
          { headers: this.getHeaders() }
        )
      );
      
      console.log('Service: Update response:', response);
      
      if (!response.success) {
        throw new Error(response.message || 'Update failed');
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Service: Error updating medical history:', error);
      
      // Enhanced error handling
      if (error.error) {
        if (error.error.message) {
          throw new Error(error.error.message);
        } else if (error.error.detail) {
          throw new Error(error.error.detail);
        }
      }
      
      if (error.status === 500) {
        throw new Error('Server error: Please check your data format and try again');
      } else if (error.status === 404) {
        throw new Error('Medical history record not found');
      } else if (error.status === 400) {
        throw new Error('Invalid data format. Please check your entries and try again');
      }
      
      throw new Error(error.message || 'Failed to update medical history');
    }
  }

  /**
   * Delete medical history
   */
  async deleteMedicalHistory(patientId: number, historyId: number): Promise<void> {
    try {
      console.log('Service: Deleting medical history', { patientId, historyId });
      
      if (!patientId || !historyId) {
        throw new Error('Missing required parameters for deletion');
      }

      const response = await firstValueFrom(
        this.http.delete<ApiResponse<any>>(
          `${this.apiUrl}/patients/${patientId}/medical-histories/${historyId}`,
          { headers: this.getHeaders() }
        )
      );
      
      console.log('Service: Delete response:', response);
      
      if (response && !response.success) {
        throw new Error(response.message || 'Delete failed');
      }
      
    } catch (error: any) {
      console.error('Service: Error deleting medical history:', error);
      
      if (error.error) {
        if (error.error.message) {
          throw new Error(error.error.message);
        } else if (error.error.detail) {
          throw new Error(error.error.detail);
        }
      }
      
      if (error.status === 404) {
        throw new Error('Medical history record not found');
      } else if (error.status === 403) {
        throw new Error('Permission denied');
      } else if (error.status === 500) {
        throw new Error('Server error occurred during deletion');
      }
      
      throw new Error(error.message || 'Failed to delete medical history');
    }
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import {   MedicalHistoryApiResponse, 
  MedicalHistoryRecord, 
  MedicalHistorySummary, 
  MedicalHistorySummaryApiResponse  } from '../domain/models/medical-history.model';


@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupère et analyse l'historique médical complet du patient.
   */
  getMedicalHistoryRecords(): Observable<MedicalHistoryRecord[]> {
    return this.http.get<MedicalHistoryApiResponse>(`${this.apiUrl}/patient/medical/medical-history`).pipe(
      map(response => {
        if (!response.success || !Array.isArray(response.data)) {
          throw new Error(response.message || 'Failed to fetch medical history');
        }
        return response.data.map((rawRecord): MedicalHistoryRecord | null => {
          try {
            return {
              ...rawRecord,
              current_medical_conditions: JSON.parse(rawRecord.current_medical_conditions || '[]'),
              past_surgeries: JSON.parse(rawRecord.past_surgeries || '[]'),
              chronic_diseases: JSON.parse(rawRecord.chronic_diseases || '[]'),
              current_medications: JSON.parse(rawRecord.current_medications || '[]'),
              allergies: JSON.parse(rawRecord.allergies || '[]'),
            };
          } catch (e) {
            console.error('Error parsing medical history record:', rawRecord, e);
            return null;
          }
        }).filter((record): record is MedicalHistoryRecord => record !== null);
      }),
      catchError(this.handleError)
    );
  }

/**
   * Récupère les statistiques récapitulatives de l'historique médical.
   */
  getMedicalHistorySummary(): Observable<MedicalHistorySummary> {
    return this.http.get<MedicalHistorySummaryApiResponse>(`${this.apiUrl}/patient/medical/summary-statistics`).pipe(
      map(response => {
        if (!response.success) {
          throw new Error(response.message || 'Failed to fetch medical history summary');
        }
        return response.data;
      }),
      catchError(this.handleError)
    );
  }


  private handleError(error: HttpErrorResponse) {
    console.error('MedicalHistoryService Error:', error);
    const userMessage = error.error?.message || 'Could not load medical data. Please try again later.';
    return throwError(() => new Error(userMessage));
  }
}
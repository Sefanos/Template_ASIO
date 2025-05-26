import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AiAnalysisResult } from '../../models/ai-analysis.model';

@Injectable({
  providedIn: 'root'
})
export class AiDiagnosticService {
  
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Analyze a medical image using AI
   * @param formData Form data containing the image and analysis parameters
   */
  analyzeImage(formData: FormData): Observable<{ data: AiAnalysisResult }> {
    return this.http.post<{ data: AiAnalysisResult }>(`${this.apiUrl}/ai/analyze`, formData);
  }

  /**
   * Get available AI models
   */
  getAvailableModels(): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/models`);
  }

  /**
   * Get analysis history for a specific patient
   */
  getPatientAnalyses(patientId: number, perPage: number = 10): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/patient/${patientId}/analyses`, {
      params: {
        per_page: perPage.toString()
      }
    });
  }

  /**
   * Get a specific analysis by ID
   */
  getAnalysis(analysisId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ai/analysis/${analysisId}`);
  }
}
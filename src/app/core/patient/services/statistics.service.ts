import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PatientStatistics, PatientStatisticsResponse } from '../domain/models/patient-statistics.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupère les statistiques pour le patient connecté (identifié par le token).
   */
  getPatientStatistics(): Observable<PatientStatistics> {
    return this.http.get<PatientStatisticsResponse>(`${this.apiUrl}/patient/medical/statistics`).pipe(
      map((response: PatientStatisticsResponse) => {
        if (response.success && response.data) {
          return response.data;
        }
        // Lance une erreur si la réponse n'est pas valide
        throw new Error(response.message || 'Failed to fetch statistics');
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('StatisticsService Error:', error);
    return throwError(() => new Error('Could not load patient statistics. Please try again later.'));
  }
}
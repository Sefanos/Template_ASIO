import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { Prescription, PrescriptionResponse } from '../domain/models/prescription.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Récupère les prescriptions pour le patient connecté.
   */
  getPrescriptions(patientId: number): Observable<Prescription[]> {
    const params = new HttpParams().set('patient_id', patientId.toString());
    
    return this.http.get<PrescriptionResponse>(`${this.apiUrl}/patient/medical/medications`, { params }).pipe(
      map(response => {
        if (!response || !response.data) {
          console.warn('PrescriptionService: La réponse de l\'API est invalide. Retour d\'un tableau vide.');
          return [];
        }
        return response.data; // Les données contiennent maintenant l'objet doctor
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else {
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    }
    console.error('PrescriptionService: Error caught', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
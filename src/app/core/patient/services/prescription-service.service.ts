import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { MedicalRecordItem } from '../../../features/patient/medical-record/components/prescription-list/prescription-list.component';  

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = 'http://127.0.0.1:8000/api'; // URL de votre API Laravel

  constructor(private http: HttpClient) { }

  /**
   * Récupère les prescriptions pour un patient donné.
   * @param patientId L'ID du patient (actuellement ignoré par le backend qui utilise un ID codé en dur pour l'utilisateur 1)
   */
  getPrescriptions(patientId: number): Observable<MedicalRecordItem[]> {
    // Le backend utilise actuellement un ID codé en dur, donc patientId n'est pas utilisé dans l'URL pour l'instant.
    // La route est /api/prescriptions
    // Le backend retourne { data: [...] }
    console.log(`PrescriptionService: Fetching prescriptions for patientId (currently unused by backend): ${patientId}`);
    return this.http.get<{ data: MedicalRecordItem[] }>(`${this.apiUrl}/prescriptions`).pipe(
      tap(response => console.log('PrescriptionService: Raw response', response)),
      map(response => {
        if (!response || !response.data) {
          console.warn('PrescriptionService: Response or response.data is undefined. Returning empty array.');
          return [];
        }
        console.log('PrescriptionService: Mapped data', response.data);
        return response.data;
      }),
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    if (error.error instanceof ErrorEvent) {
      // Erreur côté client
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Erreur côté serveur
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage += `\nServer Message: ${error.error.message}`;
      }
    }
    console.error('PrescriptionService: Error caught', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
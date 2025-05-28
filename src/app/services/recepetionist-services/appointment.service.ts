import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private apiUrl = 'http://localhost:8000/api/rendez_vous';

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';
    
    if (error.error instanceof ErrorEvent) {
      errorMessage = `Erreur: ${error.error.message}`;
    } else {
      console.error('Erreur HTTP:', error);
      errorMessage = `Erreur ${error.status}: ${error.message}`;
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      }
    }
    
    return throwError(() => errorMessage);
  }

  getAppointments(params: any = {}): Observable<any> {
    console.log('🔍 SERVICE: Récupération RDV avec params:', params);
    return this.http.get(this.apiUrl, { params }).pipe(
      tap(response => console.log('✅ SERVICE: RDV reçus:', response)),
      catchError(this.handleError)
    );
  }

  addAppointment(appointment: any): Observable<any> {
    console.log('➕ SERVICE: Ajout RDV:', appointment);
    return this.http.post(this.apiUrl, appointment).pipe(
      tap(response => console.log('✅ SERVICE: RDV ajouté:', response)),
      catchError(this.handleError)
    );
  }

  updateAppointment(id: number, appointment: any): Observable<any> {
    console.log(`🔄 SERVICE: Mise à jour RDV ${id}:`, appointment);
    
    return this.http.put(`${this.apiUrl}/${id}`, appointment).pipe(
      tap(response => console.log('✅ SERVICE: RDV mis à jour:', response)),
      catchError(error => {
        console.error('❌ SERVICE: Erreur mise à jour:', error);
        return this.handleError(error);
      })
    );
  }

  deleteAppointment(id: number): Observable<any> {
    console.log(`🗑️ SERVICE: Suppression RDV ${id}`);
    return this.http.delete(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('✅ SERVICE: RDV supprimé:', response)),
      catchError(this.handleError)
    );
  }

  getAppointment(id: number): Observable<any> {
    console.log(`👁️ SERVICE: Récupération RDV ${id}`);
    return this.http.get(`${this.apiUrl}/${id}`).pipe(
      tap(response => console.log('✅ SERVICE: RDV récupéré:', response)),
      catchError(this.handleError)
    );
  }
}
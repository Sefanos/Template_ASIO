import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { Alert, AlertsApiResponse } from '../domain/models/alert.model';

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = `${environment.apiUrl}/patient/medical/alerts`;

  constructor(private http: HttpClient) { }

  /**
   * Récupère toutes les alertes actives pour le patient.
   */
  getActiveAlerts(): Observable<Alert[]> {
    return this.http.get<AlertsApiResponse>(this.apiUrl).pipe(
      map(response => response.data.filter(alert => alert.is_active))
    );
  }
}
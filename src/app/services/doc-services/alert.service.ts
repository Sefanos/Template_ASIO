import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Alert } from '../../models/alert.model';

export interface AlertRequest {
  patient_id: number;
  title: string;
  description?: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  alert_type: 'allergy' | 'medication' | 'condition' | 'warning';
  is_active?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AlertService {
  private apiUrl = `${environment.apiUrl}/patient-alerts`;

  constructor(private http: HttpClient) {}

  getPatientAlerts(patientId: number): Observable<Alert[]> {
    // Remove the include_inactive parameter - backend should return ALL by default
    const url = `${this.apiUrl}?patient_id=${patientId}`;
    
    console.log('🔍 Fetching ALL alerts from:', url);
    
    return this.http.get<any>(url)
      .pipe(
        map(response => {
          console.log('🔍 Backend response:', response);
          
          if (!response.success || !response.data) {
            console.warn('⚠️ Invalid response format:', response);
            return [];
          }
          
          const alerts = Array.isArray(response.data) ? response.data : [response.data];
          
          // ✅ BACKEND NOW SENDS CORRECT FORMAT - NO TRANSFORMATION NEEDED!
          console.log('🔍 Received alerts from backend:', alerts);
          console.log('🔍 Debug info from backend:', response.debug_info);
          
          // Log each alert to verify active/inactive status
          alerts.forEach((alert: any, index: number) => {
            console.log(`🔍 Alert ${index + 1}:`, {
              id: alert.id,
              title: alert.title,
              isActive: alert.isActive,
              type: alert.type,
              severity: alert.severity
            });
          });
          
          return alerts; // ✅ Direct return - backend sends correct format
        }),
        catchError(error => {
          console.error('❌ Error fetching alerts:', error);
          return of([]);
        })
      );
  }

  createAlert(alertData: Alert): Observable<Alert> {
    // Transform frontend Alert model to backend AlertRequest format
    const backendData: AlertRequest = {
      patient_id: alertData.patient_id || 1, // Default patient_id if not provided
      title: alertData.title,
      description: alertData.description,
      severity: alertData.severity,
      alert_type: alertData.type, // Transform 'type' to 'alert_type'
      is_active: alertData.isActive // Transform 'isActive' to 'is_active'
    };

    return this.http.post<any>(this.apiUrl, backendData)
      .pipe(
        map(response => {
          console.log('🔍 Create response:', response);
          
          if (!response.success || !response.data) {
            console.warn('⚠️ Invalid create response:', response);
            throw new Error('Invalid response format');
          }
          
          const alert = response.data;
          console.log('🔍 Created alert from backend:', alert);
          
          // ✅ Backend sends correct format - no transformation needed
          return alert;
        }),
        catchError(error => {
          console.error('Error creating alert:', error);
          throw error;
        })
      );
  }

  updateAlert(alertId: number, alertData: Partial<Alert>): Observable<Alert> {
    // Transform frontend Alert model to backend AlertRequest format
    const backendData: Partial<AlertRequest> = {};
    
    if (alertData.title !== undefined) backendData.title = alertData.title;
    if (alertData.description !== undefined) backendData.description = alertData.description;
    if (alertData.severity !== undefined) backendData.severity = alertData.severity;
    if (alertData.type !== undefined) backendData.alert_type = alertData.type; // Transform 'type' to 'alert_type'
    if (alertData.isActive !== undefined) backendData.is_active = alertData.isActive; // Transform 'isActive' to 'is_active'
    if (alertData.patient_id !== undefined) backendData.patient_id = alertData.patient_id;

    console.log('updateAlert: Sending to backend:', backendData);

    return this.http.put<any>(`${this.apiUrl}/${alertId}`, backendData)
      .pipe(
        map(response => {
          console.log('🔍 Update response:', response);
          
          if (!response.success || !response.data) {
            console.warn('⚠️ Invalid update response:', response);
            throw new Error('Invalid response format');
          }
          
          const alert = response.data;
          console.log('🔍 Updated alert from backend:', alert);
          
          // ✅ Backend sends correct format - no transformation needed
          return alert;
        }),
        catchError(error => {
          console.error('Error updating alert:', error);
          throw error;
        })
      );
  }

  deleteAlert(alertId: number): Observable<void> {
    return this.http.delete<any>(`${this.apiUrl}/${alertId}`)
      .pipe(
        map(() => void 0),
        catchError(error => {
          console.error('Error deleting alert:', error);
          throw error;
        })
      );
  }

  toggleAlert(alertId: number, isActive: boolean): Observable<Alert> {
    return this.updateAlert(alertId, { isActive: isActive });
  }
}

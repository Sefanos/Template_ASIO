import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, catchError, throwError } from 'rxjs';
import { Bill, ApiResponse } from '../../models/bill-management.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  /**
   * Fetch all bills for a given patient by patient ID.
   * Handles wrapped API response: { data: Bill[] }
   */
  getBillsByPatient(patientId: number | string): Observable<Bill[]> {
    return this.http.get<ApiResponse<Bill[]>>(`${this.apiUrl}/bills/by-patient/${patientId}`)
      .pipe(
        map(res => res.data || []),
        catchError(err => {
          console.error('BillingService.getBillsByPatient error:', err);
          return throwError(() => err);
        })
      );
  }
}

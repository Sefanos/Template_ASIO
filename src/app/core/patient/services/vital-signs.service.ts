import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { VitalSign, VitalSignsApiResponse } from '../domain/models/vital-signs.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class VitalSignsService {
   private apiUrl = `${environment.apiUrl}/patient/medical/vitals`;

  constructor(private http: HttpClient) { }

  getVitalSigns(patientId: number, limit?: number): Observable<VitalSign[]> {
    // L'API semble être contextuelle au patient connecté.
    let params = new HttpParams();
    if (limit) {
      params = params.set('limit', limit.toString());
    }
      return this.http.get<VitalSignsApiResponse>(this.apiUrl, { params }).pipe(
      map(response => response.data)
    );
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PatientCollectionResponse {
  success: boolean;
  message: string;
  data: any[];
  pagination: {
    current_page: number;
    per_page: number;
    total: number;
    last_page: number;
    from: number;
    to: number;
  };
}

export interface PatientResourceResponse {
  success: boolean;
  message: string;
  data: any;
}

@Injectable({ providedIn: 'root' })
export class PatientService {
  private apiUrl = `${environment.apiUrl}/receptionist/patients`;

  constructor(private http: HttpClient) {}

  getPatients(
    page: number = 1,
    perPage: number = 15,
    search: string = '',
    status: string = ''
  ): Observable<PatientCollectionResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('per_page', perPage.toString());

    if (search) {
      params = params.set('search', search);
    }
    if (status) {
      params = params.set('status', status);
    }

    return this.http.get<PatientCollectionResponse>(this.apiUrl, { params });
  }

  addPatient(patientData: FormData): Observable<PatientResourceResponse> {
    return this.http.post<PatientResourceResponse>(this.apiUrl, patientData);
  }

  // Alternative method for JSON data (useful for API testing)
  addPatientJson(patientData: any): Observable<PatientResourceResponse> {
    return this.http.post<PatientResourceResponse>(this.apiUrl, patientData);
  }

  updatePatient(id: number, patientData: FormData): Observable<PatientResourceResponse> {
    // Laravel gère les FormData avec une méthode POST et un champ _method=PUT
    patientData.append('_method', 'PUT');
    return this.http.post<PatientResourceResponse>(`${this.apiUrl}/${id}`, patientData);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { CategoriesApiResponse, PatientFile, PatientFileApiResponse, SinglePatientFileApiResponse } from '../domain/models/patient-file.model';

export interface FileFilters {
  category?: string;
  date_from?: string;
  date_to?: string;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class PatientFileService {
  private apiUrl = `${environment.apiUrl}/patient-files`;

  constructor(private http: HttpClient) { }

  getFiles(filters: FileFilters = {}): Observable<PatientFile[]> {
    let params = new HttpParams();
    if (filters.category) params = params.set('category', filters.category);
    if (filters.date_from) params = params.set('date_from', filters.date_from);
    if (filters.date_to) params = params.set('date_to', filters.date_to);
    if (filters.limit) params = params.set('limit', filters.limit.toString());

    return this.http.get<PatientFileApiResponse>(this.apiUrl, { params }).pipe(
      map(response => response.data)
    );
  }

    getFileBlob(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${fileId}/download`, {
      responseType: 'blob'
    });
  }

  getCategories(): Observable<{ [key: string]: string }> {
    return this.http.get<CategoriesApiResponse>(`${this.apiUrl}/categories`).pipe(
      map(response => response.data)
    );
  }

  uploadFile(formData: FormData): Observable<PatientFile> {
    return this.http.post<SinglePatientFileApiResponse>(this.apiUrl, formData).pipe(
      map(response => response.data)
    );
  }
    /**
   * Upload a file for the currently authenticated patient.
   * ✅ NOUVELLE MÉTHODE
   */
  uploadFileForPatient(formData: FormData): Observable<PatientFile> {
    // Note: This FormData should NOT contain a patient_id
    return this.http.post<SinglePatientFileApiResponse>(`${environment.apiUrl}/patient/files`, formData).pipe(
      map(response => response.data)
    );
  }
  

  updateFile(id: number, data: { description?: string; category?: string }): Observable<PatientFile> {
    const headers = new HttpHeaders().set('Content-Type', 'application/x-www-form-urlencoded');
    
    let body = new HttpParams();
    if (data.description !== undefined && data.description !== null) {
      body = body.set('description', data.description);
    }
    if (data.category) {
      body = body.set('category', data.category);
    }

    return this.http.put<SinglePatientFileApiResponse>(`${this.apiUrl}/${id}`, body.toString(), { headers }).pipe(
      map(response => response.data)
    );
  }

  deleteFile(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }


   downloadFile(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/download`, {
      responseType: 'blob'
    });
  }
}
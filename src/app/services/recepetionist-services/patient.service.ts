import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PatientService {
  private apiUrl = 'http://localhost:8000/api/patients';

  constructor(private http: HttpClient) {}

  getPatients(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  addPatient(patient: any): Observable<any> {
    return this.http.post(this.apiUrl, patient);
  }

  updatePatient(id: number, patient: any): Observable<any> {
    // Utilise POST + _method=PUT pour la compatibilité FormData avec Laravel
    return this.http.post(`${this.apiUrl}/${id}?_method=PUT`, patient);
  }

  deletePatient(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`);
  }
}
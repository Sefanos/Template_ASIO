import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PatientSummaryService {
  private apiUrl = `${environment.apiUrl}/patient/medical/summary`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get<any>(this.apiUrl).pipe(map(res => res.data));
  }
}
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, throwError } from 'rxjs';
import { LabResultResponse, PaginatedLabResultData, StructuredResults } from '../domain/models/lab-result.model';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LabResultService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getPatientLabResults(
    page: number = 1,
    limit: number = 10,
    sortOrder: string = 'desc',
    statusFilter?: string,
    nameFilter?: string
  ): Observable<PaginatedLabResultData> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortOrder', sortOrder);

    if (statusFilter && statusFilter !== 'all') {
      params = params.set('status', statusFilter);
    }
    if (nameFilter) {
      params = params.set('name', nameFilter);
    }
    
    return this.http.get<LabResultResponse>(`${this.apiUrl}/patient/medical/lab-results`, { params }).pipe(
      map(response => {
        if (response.success && response.data) {
          response.data.data = response.data.data.map(result => {
            let parsedData: StructuredResults | undefined;
            try {
              if (result.structured_results && typeof result.structured_results === 'string') {
                parsedData = JSON.parse(result.structured_results);
              }
            } catch (error) {
              console.error('Erreur lors du parsing de structured_results pour l\'ID:', result.id, error);
            }
            return { ...result, parsed_structured_results: parsedData };
          });
          return response.data;
        }
        throw new Error(response.message || 'Failed to fetch lab results');
      })
    );
  }
}